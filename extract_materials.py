import concurrent.futures
import json
import os
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parent
specpath=root/'object-sculpt-spec.json'
spec=json.loads(specpath.read_text(encoding='utf-8'))
def run(mid):
    report=root/'evidence'/f'{mid}-pbr.json'
    args=[sys.executable,str(root.parent/'forge/stage1_intake/extract_pbr_evidence.py'),str(root/'evidence/material-crops'/f'{mid}.png'),'--out-dir',str(root/'public/pbr'/mid),'--material-id',mid,'--size','1024','--url-prefix',f'/pbr/{mid}','--report',str(report)]
    p=subprocess.run(args,capture_output=True,encoding='utf-8',env={**os.environ,'PYTHONUTF8':'1'})
    if not report.exists(): raise RuntimeError(p.stderr)
    r=json.loads(report.read_text(encoding='utf-8'))
    print(mid,r['confidence'],r['verdict'],flush=True)
    return mid,r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=dict(pool.map(run,[m['id'] for m in spec['materials']]))
for m in spec['materials']:
    r=results[m['id']]
    if r['ok']:
        m['referencePbr']={'version':'1.0','sourceImage':r['sourceImage'],'extractor':'stage1_intake/extract_pbr_evidence.py','usable':True,'confidence':r['confidence'],'targetThreshold':0.7,'verdict':r['verdict'],'maps':r['maps']}
specpath.write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
sys.exit(0 if all(r['ok'] for r in results.values()) else 1)
