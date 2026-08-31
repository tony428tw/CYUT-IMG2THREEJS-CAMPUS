"""Record the user's technical-delivery request without changing failed visual gates."""
import json,sys
from pathlib import Path
p=Path(__file__).with_name('object-sculpt-spec.json');s=json.loads(p.read_text(encoding='utf-8'))
ids={f['id'] for c in s['componentTree'] for f in c.get('localFeatures',[]) if isinstance(f,dict) and 'id' in f}
def fix_inventory(value):
 if isinstance(value,dict):
  if isinstance(value.get('mapsTo'),str) and value['mapsTo'].split('/')[-1] in ids:value['mapsTo']=value['mapsTo'].split('/')[-1]
  if isinstance(value.get('mapsTo'),dict):
   ref=value['mapsTo'].get('ref','')
   if '/' in ref and ref.split('/')[-1] in ids:value['mapsTo']={'ref':ref.split('/')[0],'via':'localFeatures.'+ref.split('/')[-1]}
  for item in value.values():fix_inventory(item)
 elif isinstance(value,list):
  for item in value:fix_inventory(item)
fix_inventory(s)
if 'materialPipeline' in s and 'schemaVersion' not in s['materialPipeline']:
 s['legacyIncompleteMaterialPipeline']=s.pop('materialPipeline')
 s['legacyIncompleteMaterialPipeline']['status']='incomplete-not-accepted'
 s['legacyIncompleteMaterialPipeline']['note']='Previous per-crop extraction record was not a valid regional materialPipeline. Preserved for provenance; referencePbr records remain authoritative. No colour acceptance is claimed.'
s['technicalDelivery']={'userRequest':'繼續完成 GLB 驗收與效能最佳化','scope':'Export, runtime and performance of current approximation. No reference-colour acceptance is inferred.','visualPipelineUnchanged':True,'optimizations':{'roundedBoxSegments':1,'sphereSegments':[10,7],'smallCylinderSegments':6,'batchBoundary':'semantic component + material + shadow state','vertexWeldTolerance':1e-5,'tangents':'normalized explicit tangent frames; deterministic fallback for degenerate UV islands','rendering':'on demand while idle; continuous only during interaction, spin or benchmark'},'tests':['check-delivery.mjs','evidence/delivery/browser-roundtrip.json','evidence/delivery/gltf-validator.json'],'status':'verification-in-progress'}
if '--complete' in sys.argv:
 d=p.parent/'evidence/delivery'
 validation=json.loads((d/'gltf-validator.json').read_text(encoding='utf-8'))
 test=json.loads((d/'technical-tests.json').read_text(encoding='utf-8'))
 download=json.loads((d/'actual-download.json').read_text(encoding='utf-8'))
 if validation['issues']['numErrors'] or validation['issues']['numWarnings'] or not test['passed'] or not download['passed']:raise RuntimeError('Technical checks have not passed')
 s['technicalDelivery']['status']='glb-and-performance-verified'
 s['technicalDelivery']['limitations']=['Reference colour not certified','Compound overlaps remain; not a watertight printing mesh','Benchmarks are device-specific']
p.write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
