"""Run existing forge gates and keep their output as evidence; no invented pass results."""
import json,os,subprocess,sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent
SPEC=ROOT/'object-sculpt-spec.json'
os.environ['PYTHONUTF8']='1'
def run(script,args=(),out=None,check=True):
    p=subprocess.run([sys.executable,str(REPO/'forge'/script),*map(str,args)],cwd=REPO,capture_output=True,encoding='utf-8')
    if out:
        path=ROOT/'evidence'/out;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(p.stdout+p.stderr,encoding='utf-8')
    print(script,p.returncode,p.stdout[:180],p.stderr[:300],flush=True)
    if check and p.returncode:raise RuntimeError(p.stdout+p.stderr)
    return p
def mark(step,evidence,status='done',reason=None):
    args=['mark',step,'--state',REPO/'.img2threejs/state.json','--status',status,'--evidence',evidence]
    if reason:args+=['--reason',reason]
    run('state.py',args)
def intake():
    s=json.loads(SPEC.read_text(encoding='utf-8'))
    run('stage1_intake/check_reference_admission.py',[s['sourceImage'],'--viewpoint','reference-match','--json'],'reference-admission.json')
    run('stage2_spec/validate_sculpt_spec.py',[SPEC,'--strict-quality'],'strict-validation.txt')
    for step,evidence in [('image-analysis',ROOT/'ANALYSIS.md'),('reference-suitability',ROOT/'ANALYSIS.md'),('reference-admission',ROOT/'evidence/reference-admission.json'),('local-spec-search',ROOT/'assessment.json'),('pre-spec-assessment',ROOT/'assessment.json'),('detail-inventory',SPEC),('projection-route',ROOT/'ANALYSIS.md'),('spec-authoring',SPEC),('material-evidence',ROOT/'evidence/palette.json'),('material-spec-wiring',SPEC),('strict-validation',ROOT/'evidence/strict-validation.txt'),('build-current-pass',ROOT/'src/createCampusModel.ts')]:mark(step,evidence)
def diagnose(passid):
    s=json.loads(SPEC.read_text(encoding='utf-8'));d=ROOT/'evidence'/passid
    shape_stage=passid in ['blockout','structural-pass','form-refinement']
    ref=ROOT/'evidence/reference-silhouette.png' if shape_stage else ROOT/'evidence/reference-isolated.png'
    shot=d/'silhouette.png' if shape_stage else d/'isolated.png'
    run('stage4_review/diagnose_render.py',['--reference',ref,'--render',shot,'--spec',SPEC,'--pass-id',passid,'--in-place','--json']+(['--map-stripped-render',shot] if passid=='blockout' else []),passid+'/tier1-shape.json')
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs=[
          pool.submit(run,'stage4_review/diagnose_render_multi_angle.py',['--reference',d/'match.png','--orbit',d/'right.png','--orbit',d/'rear.png','--json'],passid+'/multi-angle.json'),
          pool.submit(run,'stage4_review/turntable_gate.py',[item for a,f in [(0,'front'),(90,'right'),(180,'rear'),(270,'left')] for item in ['--capture',f'{a}={d/f"{f}.png"}']]+['--allow-holes','--json'],passid+'/turntable.json'),
          pool.submit(run,'stage4_review/interior_difference.py',[s['sourceImage'],d/'match.png','--json'],passid+'/interior.json',False),
          pool.submit(run,'stage4_review/self_intersection.py',[ROOT/'evidence/meshes.json','--max-samples','256','--json'],passid+'/self-intersection.json'),
          pool.submit(run,'stage4_review/attachment_anchor.py',[SPEC,'--json'],passid+'/attachment.json')]
        for job in jobs:job.result()
    run('stage3_build/orchestrate_passes.py',['check',SPEC,'--pass-id',passid],passid+'/pass-check.txt')
    run('stage4_review/make_comparison_sheet.py',['--reference',s['sourceImage'],'--render',d/'match.png','--out',d/'comparison.png','--json'],passid+'/comparison.json')
def accept(passid):
    d=ROOT/'evidence'/passid;r=json.loads((d/'review.json').read_text(encoding='utf-8'))
    run('stage4_review/append_review.py',[SPEC,'--pass-id',passid,'--fidelity',r['score'],'--action','continue','--summary',r['summary'],'--render-screenshot',d/'match.png','--comparison-image',d/'comparison.png','--ai-vision-score',r['score'],'--layer-scores-json',json.dumps(r['layers']),'--feature-reviews-json',json.dumps(r['features']),'--map-stripped-render',d/'silhouette.png','--in-place'])
    run('stage3_build/orchestrate_passes.py',['sync',SPEC,'--in-place'])
    run('next.py',['--state',REPO/'.img2threejs/state.json',SPEC])
    s=json.loads(SPEC.read_text(encoding='utf-8'));s['campusBlueprint']['activeStage']=min([p['id'] for p in s['buildPasses']].index(passid)+1,7)
    SPEC.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':
    if sys.argv[1]=='intake':intake()
    elif sys.argv[1]=='diagnose':diagnose(sys.argv[2])
    elif sys.argv[1]=='accept':accept(sys.argv[2])
