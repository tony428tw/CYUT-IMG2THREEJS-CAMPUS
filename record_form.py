import json
from pathlib import Path
p=Path(__file__).with_name('object-sculpt-spec.json')
s=json.loads(p.read_text(encoding='utf-8'))
s['campusBlueprint']['formRecipes']={
 'hipTiles':{'courseSpacing':.18,'frontRibSpacing':.22,'sideRibSpacing':.25,'seamRadius':.014,'interpolation':'bottom rectangular ring to truncated upper ring; continuous four-sided courses'},
 'canopy':{'tiers':6,'lobesPerTier':11,'coreRadii':[.73,.44,.68],'lobeRadii':[.40,.34,.40],'seed':'analytic phase i*2.4, j*2.09; radial .72 to 1.02; no random input'},
 'streetscape':{'lampX':[-10,-5.3,5.3,9.7],'lampHeight':1.93,'peopleCount':9,'roadTopY':.15,'markingTopY':.165,'crosswalkX':[-10,0,8.5]},
 'lettering':'Typeset Chinese campus name with a simplified sun emblem; not recovered official vector logo',
 'rear':'Closed stone mass; unobserved rear detail remains inferred and simplified',
 'formRelief':'Geometric roof courses and ridges; tower stone horizontal joints; pediment and minute ticks; balcony post caps; window mullions'
}
p.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
