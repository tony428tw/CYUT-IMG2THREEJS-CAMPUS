import subprocess,sys,json,os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
root=Path(__file__).resolve().parent;forge=root.parent/'forge';d=root/'evidence/delivery';os.environ['PYTHONUTF8']='1'
def run(name,args,out):
 p=subprocess.run([sys.executable,str(forge/name),*map(str,args)],capture_output=True,text=True,encoding='utf-8',cwd=root)
 (d/out).write_text(p.stdout+p.stderr,encoding='utf-8');print(out,p.returncode,flush=True);return p.returncode
jobs=[
 ('stage4_review/diagnose_render.py',['--reference',d/'after.png','--render',d/'glb-match.png','--json'],'glb-image-gate.json'),
 ('stage4_review/diagnose_render_multi_angle.py',['--reference',d/'glb-match.png','--orbit',d/'glb-right.png','--orbit',d/'glb-rear.png','--json'],'glb-multi-angle.json'),
 ('stage4_review/turntable_gate.py',[arg for a,v in [(0,'front'),(90,'right'),(180,'rear'),(270,'left')] for arg in ['--capture',f'{a}={d/f"glb-{v}.png"}']]+['--allow-holes','--json'],'glb-turntable.json'),
 ('stage4_review/interior_difference.py',[d/'after.png',d/'glb-match.png','--json'],'glb-interior.json'),
 ('stage4_review/check_part_coverage.py',['--spec',root/'object-sculpt-spec.json','--manifest',d/'parts.json'],'part-coverage.txt'),
 ('stage2_spec/validate_sculpt_spec.py',[root/'object-sculpt-spec.json','--strict-quality'],'strict-validation.txt')]
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda j:run(*j),jobs))
if any(results):sys.exit(1)
