import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

export function modelStats(root:THREE.Object3D){
  let meshes=0,triangles=0,vertices=0;const materials=new Set(),geometries=new Set();
  root.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;vertices+=o.geometry.attributes.position.count;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  return {meshes,triangles,vertices,materials:materials.size,geometries:geometries.size};
}

/** Persist a normalized tangent frame so GLB viewers need not invent different frames. */
export function addPortableTangents(root:THREE.Group,materialNames:Set<string>){
  root.traverse(o=>{
    if(!(o instanceof THREE.Mesh)||Array.isArray(o.material)||!materialNames.has(o.material.name))return;
    if(!o.geometry.index){const old=o.geometry;o.geometry=mergeVertices(old,1e-5);old.dispose();}
    const g=o.geometry;if(!g.attributes.uv||!g.attributes.normal)return;
    g.computeTangents();const t=g.attributes.tangent,n=g.attributes.normal;
    const normal=new THREE.Vector3(),tangent=new THREE.Vector3(),axis=new THREE.Vector3();
    for(let i=0;i<t.count;i++){
      normal.fromBufferAttribute(n,i).normalize();tangent.fromBufferAttribute(t,i);
      tangent.addScaledVector(normal,-normal.dot(tangent));
      // A degenerate UV island has no unique tangent; choose a stable perpendicular frame.
      if(!Number.isFinite(tangent.lengthSq())||tangent.lengthSq()<1e-10){axis.set(Math.abs(normal.y)<.9?0:1,Math.abs(normal.y)<.9?1:0,0);tangent.crossVectors(axis,normal);}
      tangent.normalize();t.setXYZW(i,tangent.x,tangent.y,tangent.z,t.getW(i)<0?-1:1);
    }
  });
}

/** Batch only within a semantic part, material and shadow state. Never fuse unrelated parts. */
export function batchCampus(root:THREE.Group){
  root.updateMatrixWorld(true);
  const batches=new Map<THREE.Object3D,Map<string,THREE.Mesh[]>>();
  root.traverse(o=>{
    if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;
    let owner=o.parent;while(owner&&!owner.userData.componentId)owner=owner.parent;if(!owner)return;
    if(!batches.has(owner))batches.set(owner,new Map());
    const key=`${o.material.uuid}:${o.castShadow}:${o.receiveShadow}:${o.visible}`;
    const bucket=batches.get(owner)!;if(!bucket.has(key))bucket.set(key,[]);bucket.get(key)!.push(o);
  });
  const retired=new Set<THREE.BufferGeometry>();
  for(const [owner,buckets] of batches){
    const inverse=owner.matrixWorld.clone().invert();
    for(const list of buckets.values()){
      if(list.length<2)continue;
      const transformed=list.map(o=>{
        const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
        // The model uses only these attributes; normals/UVs survive transform and welding.
        for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);
        if(!g.getAttribute('uv'))g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
        g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));g.clearGroups();return g;
      });
      const merged=mergeGeometries(transformed,false);if(!merged)throw new Error('Component batching failed');
      const welded=mergeVertices(merged,1e-5);merged.dispose();transformed.forEach(g=>g.dispose());
      welded.computeBoundingBox();welded.computeBoundingSphere();
      const first=list[0],mesh=new THREE.Mesh(welded,first.material);
      mesh.name=`${owner.name}-${(first.material as THREE.Material).name||'material'}-batch`;
      mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.visible=first.visible;
      mesh.userData={explodeWithParent:true,sourceMeshCount:list.length};owner.add(mesh);
      for(const old of list){old.removeFromParent();retired.add(old.geometry);}
    }
  }
  const alive=new Set<THREE.BufferGeometry>();root.traverse(o=>{if(o instanceof THREE.Mesh)alive.add(o.geometry);});
  retired.forEach(g=>{if(!alive.has(g))g.dispose();});root.updateMatrixWorld(true);
}

/** Build a canonical, serializable assembly without mutating the live view or copying runtime cycles. */
export function buildExportScene(source:THREE.Group){
  const rest=source.userData.sculptRuntime?.restPositions as Record<string,THREE.Vector3>|undefined;
  function copy(o:THREE.Object3D):THREE.Object3D{
    const next=o instanceof THREE.Mesh?new THREE.Mesh(o.geometry,o.material):o instanceof THREE.Group?new THREE.Group():new THREE.Object3D();
    next.name=o.name;next.position.copy(rest?.[o.userData.componentId]??o.position);next.quaternion.copy(o.quaternion);next.scale.copy(o.scale);
    next.visible=o.visible;next.castShadow=o.castShadow;next.receiveShadow=o.receiveShadow;
    for(const key of ['componentId','label','actionProfile','explodeWithParent','sourceMeshCount'])if(o.userData[key]!==undefined)next.userData[key]=JSON.parse(JSON.stringify(o.userData[key]));
    for(const child of o.children)next.add(copy(child));return next;
  }
  const result=copy(source) as THREE.Group;result.position.set(0,0,0);result.quaternion.identity();result.scale.set(1,1,1);
  result.userData={asset:'Chaoyang clocktower campus',reconstruction:'single-image stylized approximation',upAxis:'Y',materialFidelity:'not certified; prior colour gate remains unresolved'};
  result.updateMatrixWorld(true);return result;
}

export async function exportCampusGLB(model:THREE.Group){
  if(model.userData.assetError)throw new Error(model.userData.assetError);
  if(!model.userData.assetsReady)throw new Error('材質尚未載入完成');
  const result=await new GLTFExporter().parseAsync(buildExportScene(model),{binary:true,onlyVisible:true,trs:true});
  if(!(result instanceof ArrayBuffer))throw new Error('GLB exporter did not return a binary buffer');
  return result;
}
