import json
from pathlib import Path
p=Path(__file__).with_name('object-sculpt-spec.json');s=json.loads(p.read_text(encoding='utf-8'))
colors={'stone':'#baa281','trim':'#d4b797','roof':'#a1654a','brick':'#bd5a2f','grass':'#8d971e','foliage':'#8d9d30','glass':'#738e96','paving':'#ead3b8','base':'#b8966f','road':'#ae9c8b','metal':'#554a3c'}
for m in s['materials']:
 if m['id'] in colors:m['renderColor']=colors[m['id']]
 m['renderNotes']='Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo.'
 m['textureProjection']['mode']='dominant-face-object-space'
 m['textureProjection']['repeat']=[1,1]
s['campusBlueprint']['materialRecipe']={'leafLight':'#aab544','bumpScale':.012,'normalStrength':.09,'aoIntensity':.15,'mapRepeat':1,'uvWorldUnitsPerTile':2,'photometricCaveat':'reference-derived inference, not exact inverse PBR recovery'}
s['materialPipeline']={'status':'proceed','regions':[{'regionId':m['id']+'-visible','materialId':m['id'],'status':'proceed','evidence':m.get('referencePbr',{}).get('sourceImage')} for m in s['materials'] if m.get('referencePbr')]}
for c in s['componentTree']:c['colorMaterialRecipe']['componentId']=c['id']
p.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
