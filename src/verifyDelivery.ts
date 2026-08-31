import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildExportScene,exportCampusGLB,modelStats} from './modelDelivery';

export async function verifyDelivery(model:THREE.Group){
  let data:ArrayBuffer;
  try{data=await exportCampusGLB(model);}catch(e){throw new Error('GLB export: '+String(e)+(e instanceof Error?' '+e.stack:''));}
  const expected=buildExportScene(model);
  let gltf;
  try{gltf=await new GLTFLoader().parseAsync(data,'');}catch(e){throw new Error('GLB reload: '+String(e)+(e instanceof Error?' '+e.stack:''));}
  gltf.scene.updateMatrixWorld(true);
  const before=modelStats(expected),after=modelStats(gltf.scene);
  const ids=(o:THREE.Object3D)=>{const result:string[]=[];o.traverse(n=>{if(n.userData.componentId)result.push(n.userData.componentId);});return result.sort();};
  const a=new THREE.Box3().setFromObject(expected),b=new THREE.Box3().setFromObject(gltf.scene);
  const boundsError=Math.max(a.min.distanceTo(b.min),a.max.distanceTo(b.max));
  const jsonLength=new DataView(data).getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,jsonLength)));
  const failures:string[]=[];
  if(before.triangles!==after.triangles)failures.push('Triangle count changed');
  if(JSON.stringify(ids(expected))!==JSON.stringify(ids(gltf.scene)))failures.push('Semantic component IDs changed');
  if(boundsError>1e-4)failures.push('Bounds changed');
  if(json.buffers.some((x:{uri?:string})=>x.uri)||json.images?.some((x:{uri?:string})=>x.uri))failures.push('External buffer/image dependency');
  if(!json.images?.length)failures.push('No embedded images');
  if(failures.length)throw new Error(failures.join('; '));
  const saved=await fetch('/__local-delivery/glb',{method:'POST',headers:{'Content-Type':'model/gltf-binary'},body:data});if(!saved.ok)throw new Error(await saved.text());
  const report={passed:true,bytes:data.byteLength,before,after,components:ids(gltf.scene).length,boundsError,embeddedImages:json.images.length,externalDependencies:0,saved:await saved.json()};
  const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>(),tex=new Set<THREE.Texture>();
  gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)tex.add(v);}}});
  geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose());return report;
}
