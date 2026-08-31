"""Reproducible, reference-specific authoring data; never changes review decisions."""
import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'forge/stage1_intake'))
from build_detail_inventory import read_png, write_png_rgb

def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

s = json.loads((ROOT / 'object-sculpt-spec.json').read_text(encoding='utf-8'))
template = copy.deepcopy(s['componentTree'][0])
mat_template = copy.deepcopy(s['materials'][0])
s['componentTree'] = []
s['materials'] = []
passes = [p['id'] for p in s['buildPasses']]

def component(cid, name, level, kind, pos, size, material, stage=0, parent='root', **params):
    c = copy.deepcopy(template)
    c.update(id=cid, name=name, level=level, role='architectural-assembly', parent=parent,
             primitive='ellipsoid' if kind=='tree' else 'box', topologyClass='continuous-sculpt' if kind=='tree' else 'assembled-solid',
             topologyRationale='Overlapping rounded botanical volumes' if kind=='tree' else 'Discrete architectural solid with specified planar and curved boundaries',
             confidence=0.86, importance=0.9, material=material, materialLayers=[material], fidelityTier=passes[stage],
             dimensions=dict(zip(['width','height','depth'],size)),
             transform={'position':pos, 'rotation':[0,0,0], 'scale':[1,1,1]},
             localFeatures=[{'id':cid+'-shape','type':'raised ridge','placement':pos,'size':size,
                 'geometryEffect':kind, 'materialEffect':'subtle relief shadow', 'confidence':0.86,'evidenceRefs':['full-object']}],
             details=[name], evidenceRefs=['full-object'])
    c['geometryDescriptor'].update(topologyIntent=kind, edgeTreatment={'type':'bevel','bevelRadius':0.04,'segments':3})
    c['actionProfile'].update(animationRole='static-part', sockets=[{'id':'assembly-origin','position':[0,0,0]}])
    c['actionProfile']['collider'].update(scale=size, notes='Relative-size bounding proxy, not structural engineering dimensions')
    c['actionProfile']['destruction'].update(fractureGroup=cid, detachableFragments=[cid], debrisMaterial=material)
    c['actionProfile']['pivot']['confidence']=0.86
    c['campus']={'kind':kind,'stage':stage,**params}
    if cid=='root':
        c['parent']=None
        c['actionProfile']['animationRole']='root'
    s['componentTree'].append(c)
    return c

component('root','校園微縮景觀','macro','container',[0,0,0],[28,14,17.5],'stone')
component('plinth','圓角展示底座','macro','plinth',[0,-0.60,0],[28,1.2,17.5],'base')
component('landscape','抬高庭園','macro','garden-base',[0,0.15,-1.4],[26.8,0.32,12.9],'grass')
component('west-wing','西側校舍','macro','wing',[-6.4,4.40,-1.3],[6.6,7.7,5.2],'stone')
component('east-wing','東側校舍','macro','wing',[6.4,4.40,-1.3],[6.6,7.7,5.2],'stone')
component('central-block','中央校舍','macro','wing',[0,4.7,-1.7],[6.4,8.3,5.2],'stone')
component('tower','鐘樓塔身','macro','tower',[0,9.50,-0.35],[2.6,7.6,2.75],'stone')
component('tower-roof','鐘樓尖頂','macro','hip',[0,13.32,-0.35],[3.3,1.42,3.4],'roof',topRatio=0.015)
for side,x in [('west',-6.4),('east',6.4)]:
    component(side+'-roof','側翼紅瓦屋頂','macro','hip',[x,8.27,-1.3],[7.1,1.65,5.7],'roof',topRatio=0.65)
component('central-roof','中央紅瓦屋頂','macro','hip',[0,8.88,-1.7],[7.0,1.7,5.7],'roof',topRatio=0.60)
component('arcade','入口三拱廊','macro','arcade',[0,0.55,3.10],[8.4,2.8,2.6],'brick',count=3)
component('arcade-roof','入口低紅瓦屋頂','macro','hip',[0,3.34,3.0],[9.0,1.25,3.35],'roof',topRatio=0.69)
for side,x in [('west',-3.15),('east',3.15)]:
    component(side+'-turret','前方石砌角塔','macro','turret',[x,5.8,1.1],[1.8,5.0,1.75],'stone')
    component(side+'-turret-roof','角塔四坡屋頂','macro','hip',[x,8.33,1.1],[2.15,1.5,2.15],'roof',topRatio=0.43)
for side,x in [('west',-6.4),('east',6.4)]:
    component(side+'-arcade','側翼磚拱窗','meso','arcade',[x,0.55,1.46],[6.6,2.35,0.45],'brick',1,count=4,glazed=True)
    component(side+'-windows','三層藍灰窗格','meso','windows',[x,3.25,1.36],[6.6,4.8,0.2],'glass',1,columns=5,rows=3)
    component(side+'-piers','石柱與腰線','meso','piers',[x,3.0,1.42],[6.6,5.25,0.25],'trim',1)
    component(side+'-dormers','雙老虎窗','meso','dormers',[x,8.72,0.94],[6.6,1.15,1.0],'trim',1,count=2)
    component(side+'-parapets','屋頂女兒牆','meso','parapet',[x,9.86,-1.3],[4.6,0.38,3.7],'trim',1)
    component(side+'-side-windows','側立面窗格','meso','side-windows',[(-1 if side=='west' else 1)*9.72,3.25,-1.3],[5.2,4.8,0.2],'glass',1,columns=3,rows=3,side=side)
component('central-windows','中央立面窗格','meso','windows',[0,3.20,0.95],[6.0,4.8,0.2],'glass',1,columns=4,rows=3)
component('tower-clock','圓形時鐘','meso','clock',[0,12.21,1.075],[1.38,1.38,0.2],'trim',1)
component('tower-window','鐘樓長拱窗','meso','arched-window',[0,8.95,1.045],[1.0,2.7,0.18],'glass',1)
component('tower-lower-window','鐘樓底層窗','meso','windows',[0,6.3,1.055],[1.2,1.15,0.2],'glass',1,columns=1,rows=1)
component('balcony','雙拱陽台','meso','balcony',[0,4.50,1.98],[3.65,1.95,1.65],'stone',1)
component('stairs','中央階梯','meso','stairs',[0,0.05,5.35],[4.2,0.82,2.6],'trim',1,count=9)
component('pavement','前方人行道','meso','pavement',[0,0.065,6.46],[27,0.13,1.7],'paving',1)
component('road','校門前道路','meso','road',[0,0.025,7.9],[26.8,0.06,2.7],'road',1)
component('roof-dormers','入口四老虎窗','meso','dormers',[0,3.80,4.08],[8.4,0.88,0.74],'trim',1,count=4)
component('central-parapet','中央屋頂圍牆','meso','parapet',[0,10.49,-1.7],[4.4,0.33,3.6],'trim',1)
component('front-plaque','朝陽科技大學銘牌','meso','plaque',[0,-0.50,8.83],[5.7,0.83,0.20],'trim',2)
for side,sign in [('west',-1),('east',1)]:
    component(side+'-hedges','曲線修剪綠籬','meso','hedges',[sign*6.3,0.36,4.6],[7.0,0.7,2.35],'grass',1,side=sign)
    for j,(z,h) in enumerate([(-4.4,6.8),(-1.45,6.4),(1.45,5.1)]):
        component(side+f'-tree-{j}','分層闊葉樹','macro','tree',[sign*(10.7+(0.1 if j==1 else -0.2)),0.30,z],[3.4,h,3.4],'foliage',0,seed=20+j+(4 if sign>0 else 0))
    component(side+'-shrubs','庭園灌木花叢','micro','shrubs',[sign*7.0,0.43,3.85],[7.0,0.6,2.8],'foliage',2,side=sign)
component('lamp-system','四座路燈','micro','lamps',[0,0.18,6.45],[23,1.7,0.2],'metal',2)
component('pedestrians','校園行人','micro','people',[0,0.19,6.46],[22,0.62,0.5],'paving',2)
component('road-markings','行穿線與道路標線','micro','markings',[0,0.063,7.9],[26,0.02,2.65],'trim',2)
component('campus-sign','庭園直立校牌','micro','sign',[-11.4,0.2,4.6],[1.1,1.6,0.24],'trim',2)
for cid,parent in [('roof-tiles','east-roof'),('brick-joints','arcade'),('stone-joints','tower'),('clock-marks','tower-clock'),('balustrade','balcony'),('window-mullions','east-windows')]:
    component(cid,'表面細節 '+cid,'micro','relief',[0,0,0],[0.1,0.1,0.1],'trim',2,parent=parent)

regions={'stone':(652,345,24,66),'brick':(627,529,40,30),'roof':(1170,396,63,25),'foliage':(1273,483,53,31),'base':(125,688,110,26),'paving':(260,630,25,16),'glass':(824,237,15,31),'grass':(573,654,38,14),'trim':(810,356,53,14),'road':(652,764,76,16),'metal':(248,612,4,32)}
w,h,pixels=read_png(Path(s['sourceImage']))
palette={}
for mid,(x,y,cw,ch) in regions.items():
    crop=[pixels[(y+v)*w+x+u] for v in range(ch) for u in range(cw)]
    med=[sorted(p[k] for p in crop)[len(crop)//2] for k in range(3)]
    color='#'+''.join(f'{v:02x}' for v in med)
    palette[mid]={'medianRGB':med,'hex':color,'regionPixels':[x,y,cw,ch]}
    out=ROOT/'evidence/material-crops'/f'{mid}.png'
    out.parent.mkdir(parents=True,exist_ok=True)
    write_png_rgb(out,cw,ch,[p[:3] for p in crop])
    m=copy.deepcopy(mat_template)
    m.update(id=mid,name=mid,baseColor=color,color=color,notes='Sampled reference median; source lighting is not physical albedo',
             localOverrides=[{'id':mid+'-variation','region':'component surfaces','color':color,'roughness':0.77,'evidenceRefs':['full-object'],'description':'Subtle instance variation and contact-shaded relief'}])
    m['albedo']={'dominant':color,'secondary':[color],'samplingNotes':f'Observed pixel crop {x},{y},{cw},{ch}; de-lighting required before map use'}
    m['colorVariation']['palette']=[color]
    m['colorVariation']['amplitude']=0.045
    m['roughness']['base']=0.29 if mid=='glass' else 0.83
    m['normal']['strength']=0.12
    m['bump'].update(pattern='fine grain',amplitude=0.012,scale=20)
    if mid=='glass': m['clearcoat']=0.15
    s['materials'].append(m)
save(ROOT/'evidence/palette.json',palette)

a=s['preSpecAssessment']
a['objectClass'].update(primaryType='tabletop architectural campus diorama',primaryDomain='object',formLanguage=['architectural','botanical-like'],structureKind=['compound object','repeated modules'],motionPotential=['whole-object transform','detachable'],materialFamilies=['stone','ceramic','glass-like','leaf','bark'],notes='Tiny decorative people are scenery; not a character likeness reconstruction.')
a['complexity']['scores']={k:3 if k!='actionReadinessNeed' else 1 for k in a['complexity']['scores']}
a['complexity']['estimatedCounts']={'macroComponents':sum(c['level']=='macro' for c in s['componentTree']),'mesoComponents':sum(c['level']=='meso' for c in s['componentTree']),'microFeatureGroups':sum(c['level']=='micro' for c in s['componentTree']),'materialLayers':len(s['materials']),'repetitionSystems':5}
a['complexity']['reasoning']=['Multiple nested architectural volumes, repeated windows/roof tiles/arches, organic foliage and small streetscape details.']
a['specDepthDecision']['rationale']='Dense architectural diorama with macro massing, meso façade systems and micro tile/window/vegetation systems.'
a['unknownsToResolveBeforeImplementation']=[]
a['documentedLimitations']=['Rear elevation inferred by symmetry; no interior rooms claimed.','Tiny plaque logo and pedestrian faces approximated.']
a['detailInventory']={'scanMethod':'grid-3x3','targetMinDetails':16,'details':[]}
for c in s['componentTree']:
    if c['campus']['stage']>0:
        a['detailInventory']['details'].append({'id':c['id']+'-detail','kind':'linework' if 'window' in c['id'] else 'ridge','region':{'x':0.25,'y':0.15,'width':0.58,'height':0.65},'description':c['name'],'affects':['geometry','material'],'scale':'relative','evidenceRef':'full-object','confidence':0.84,'mapsTo':{'ref':c['id']+'/'+c['id']+'-shape'}})
s['qualityContract']['definitionOfDone']=['A recognizable, interactive stylized reconstruction of the supplied clocktower campus diorama with matching relative massing, true central arches, red hip roofs and pale stone facade.','Preserve blue window grids, stepped entrance, rounded display plinth, road crossings and clustered green vegetation.','Rear/occluded architecture is explicitly inferred. No exact architectural survey or exact logo claim.']
s['scores']={'object_isolation':3,'silhouette_readability':3,'depth_inference':2,'primitive_decomposition':3,'material_procedurality':3,'occlusion_risk':1,'interaction_fit':3}
s['coordinateFrame']={'front':'+Z','up':'+Y','scaleReference':'28-unit plinth width; relative units, not metres'}
s['silhouette']={'boundingShape':'Rounded rectangular plinth with bilateral stone wings and central tall tower','aspectRatios':['plinth width:depth=28:17.5','building width:tower height=19.4:14.74'],'symmetry':'bilateral architecture; asymmetric vegetation','dominantCurves':['round arches','ellipsoidal foliage','plinth corners'],'negativeSpaces':['three entrance arches','two balcony arches'],'landmarks':['clock centre y12.21','roof apex y14.74','wing eaves y8.27']}
s['referenceCamera'].update(aspect=1672/941,positionHint=[22,23,40],orientation={'yaw':28,'pitch':26,'roll':0},projection='orthographic',target=[0,5.3,0],verticalSpan=21.5,note='Approximate from visible façade slopes; not a calibrated survey camera')
s['viewEvidence'][0].update(confidence=0.9,observations=['See ANALYSIS.md for pixel anchors, assembly observations and single-view limits.'])
s['assumptions']=['Source is a stylized tabletop diorama; back and interiors unobserved.','Poster title/callouts are not geometry.']
s['repetitionSystems']=[{'id':id,'distribution':dist,'count':count,'componentRefs':refs,'buildsGeometry':True,'realization':'instanced-geometry','evidenceRefs':['full-object']} for id,dist,count,refs in [('window-grid','5 columns by 3 storeys',30,['east-windows','west-windows']),('tile-grid','roof UV row seams and staggered ribs',900,['roof-tiles']),('foliage-clusters','seeded branch tiers',300,['east-tree-0','west-tree-0']),('paving-grid','staggered walkway pavers',200,['pavement']),('arcade-rhythm','three central and four wing bays',11,['arcade','east-arcade','west-arcade'])]]
for i,p in enumerate(s['buildPasses']):
    p['componentRefs']=[c['id'] for c in s['componentTree'] if c['campus']['stage']<=i]
s['featureReviewTargets']=[]
for id,name,refs,start in [('clocktower-massing','Tall central clocktower and bilateral wing proportions',['tower','east-wing','west-wing'],0),('hip-roof-system','Red truncated hip roofs and tower pyramid',['east-roof','west-roof','tower-roof'],0),('entrance-and-ground','Three-arch entry, plinth and raised garden',['arcade','plinth','landscape'],0),('facade-window-system','Repeated blue window bays and dormers',['east-windows','west-windows','tower-window'],1),('landscape-canopy','Tiered broadleaf canopy and garden rhythm',['east-tree-0','west-tree-0','east-hedges'],1)]:
    s['featureReviewTargets'].append({'id':id,'name':name,'tier':'critical','minimumScore':0.8,'passIds':passes[start:],'componentRefs':refs,'evidenceRefs':['full-object'],'mustPass':True})
s['lightingFromPhoto']=['Warm large key light from upper front-left; contact shadows fall right/back.','Hemisphere fill cream/grey 1.2; key 3.0 with soft shadow, cool rim 0.6.','ACES filmic tone mapping exposure 1.15, warm ivory background #f8f3e9, contact shadow under plinth.']
s['performanceBudget'].update(targetTriangles=250000,maxDrawCalls=350,textureSize=1024,fpsTarget=30)
s['risks']=['One-view occlusion prevents exact rear reconstruction.','Instanced foliage and generated text approximate dense tiny details.']
s['campusBlueprint']={'seed':428,'activeStage':0,'notes':'Subject-specific renderer consumes component campus.kind, dimensions and positions. Stage unlocks follow reviewHistory, not UI.'}
for c in s['componentTree']:
    rgb=palette[c['material']]['medianRGB']
    rgba='rgba('+', '.join(map(str,rgb))+', 1)'
    c['colorMaterialRecipe']={'dominantAlbedo':rgba,'secondaryAlbedo':rgba,'materialClass':'glass' if c['material']=='glass' else 'stone','materialClassConfidence':0.75,'evidenceRefs':['full-object']}
save(ROOT/'object-sculpt-spec.json',s)
save(ROOT/'assessment.json',{'preSpecAssessment':a,'qualityContract':s['qualityContract'],'localSpecSearch':s['localSpecSearch']})
print('Authored',len(s['componentTree']),'components;',len(a['detailInventory']['details']),'mapped details')
