import copy,json
from pathlib import Path
R=Path(__file__).resolve().parent
p=R/'object-sculpt-spec.json';s=json.loads(p.read_text(encoding='utf-8'))
nodes={c['id']:c for c in s['componentTree']}
for side in ['west','east']:
    c=nodes[side+'-wing'];c['dimensions']['height']=6.7;c['transform']['position'][1]=3.9
    nodes[side+'-roof']['transform']['position'][1]=7.27
    nodes[side+'-windows']['dimensions']['height']=4.15
    nodes[side+'-windows']['transform']['position'][1]=3.03
    nodes[side+'-side-windows']['dimensions']['height']=4.15
    nodes[side+'-side-windows']['transform']['position'][1]=3.03
    nodes[side+'-piers']['dimensions']['height']=4.25
    nodes[side+'-dormers']['transform']['position'][1]=7.72
    nodes[side+'-parapets']['transform']['position'][1]=8.86
    nodes[side+'-turret']['dimensions']['height']=5.6
    nodes[side+'-turret']['transform']['position'][1]=6.1
    nodes[side+'-turret-roof']['transform']['position'][1]=8.93
    nodes[side+'-tree-0']['dimensions']['height']=7.8
    c=copy.deepcopy(nodes[side+'-tree-0']);c['id']=side+'-rear-tree';c['name']='後方闊葉樹';c['dimensions']['height']=8.3;c['transform']['position']=[-8.7 if side=='west' else 8.7,.3,-5.1];c['campus']['seed']=39 if side=='west' else 41;s['componentTree'].append(c)
nodes['road']['level']='macro';nodes['road']['campus']['stage']=0;nodes['road']['fidelityTier']='blockout'
s['referenceCamera'].update(positionHint=[19,23,42],target=[0,4.4,0])
s['campusBlueprint']['massingRevision']='Lower outer wing eaves 8.27→7.27; raise turret roof 8.33→8.93; add observed rear foliage; road is a silhouette-defining macro frontage.'
for i,pas in enumerate(s['buildPasses']):pas['componentRefs']=[c['id'] for c in s['componentTree'] if c['campus']['stage']<=i]
p.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
