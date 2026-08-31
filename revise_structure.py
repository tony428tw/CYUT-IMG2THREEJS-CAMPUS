import json
from pathlib import Path
p=Path(__file__).resolve().parent/'object-sculpt-spec.json';s=json.loads(p.read_text(encoding='utf-8'));n={c['id']:c for c in s['componentTree']}
n['tower-clock']['transform']['position'][1]=12.65
n['tower-window']['transform']['position'][1]=10.05
n['tower-window']['dimensions']['height']=2.3
n['tower-lower-window']['transform']['position'][1]=7.65
n['balcony']['transform']['position'][1]=5.3
for id in ['arcade','arcade-roof','roof-dormers']:n[id]['transform']['position'][1]+=.7
n['stairs']['dimensions']['height']=1.16;n['stairs']['transform']['position'][0]=1
for c in s['componentTree']:
    if c['campus']['kind']=='tree':c['campus']['canopyRecipe']={'tierCount':6,'verticalRadius':.48,'subclustersPerTier':3,'branchAttachment':'trunk to tier centre'}
    if c['campus']['kind']=='turret':c['localFeatures'].append({'id':'turret-slit-window','type':'hole','geometryEffect':'three vertically repeated inset slit windows','confidence':.83,'evidenceRefs':['full-object']})
s['campusBlueprint']['structureRevision']='Clock centre 12.65; intact tall arched window centred 10.05 above roof trim; balcony raised to 5.3 with genuine paired arches; entrance raised 0.7 and stairs aligned. Layered branch/canopy structure from reference.'
p.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
