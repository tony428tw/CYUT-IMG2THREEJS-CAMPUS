import json
from pathlib import Path
p=Path(__file__).resolve().parent/'object-sculpt-spec.json';s=json.loads(p.read_text(encoding='utf-8'))
for c in s['componentTree']:
    if c['campus']['kind'] in ['wing','tower','turret','hip','arcade','windows','side-windows','piers','dormers','parapet','clock','arched-window','balcony']:
        c['transform']['position'][0]+=1.0
        c['transform']['position'][1]-=.15
    if c['id']=='west-rear-tree':c['dimensions']['height']=6.7
    if c['id']=='west-tree-0':c['dimensions']['height']=6.8
    if c['id']=='road':c['dimensions']['depth']=1.8;c['transform']['position']=[0,.12,7.65]
s['campusBlueprint']['alignmentRevision']='Visible tower apex sits 40px right of plinth centre: architecture offset +1 x, -0.15 y. Lower west rear trees to reference upper canopy; correct road to lie on plinth.'
p.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
