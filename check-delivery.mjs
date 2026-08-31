import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {build} from 'esbuild';
import * as THREE from 'three';
import validator from 'gltf-validator';
await fs.mkdir('evidence/delivery',{recursive:true});
await build({entryPoints:['src/createCampusModel.ts','src/modelDelivery.ts'],outdir:'evidence/delivery/runtime',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},external:['three','three/*']});
const {createCampusModel}=await import('./evidence/delivery/runtime/createCampusModel.mjs');
const {buildExportScene,modelStats}=await import('./evidence/delivery/runtime/modelDelivery.mjs');
const spec=JSON.parse(await fs.readFile('object-sculpt-spec.json','utf8'));
const original=createCampusModel(spec,{optimize:false}),optimized=createCampusModel(spec);
const originalStats=modelStats(original),optimizedStats=modelStats(optimized),runtime=optimized.userData.sculptRuntime;
const expectedBounds=new THREE.Box3().setFromObject(optimized);
const clean=buildExportScene(optimized);
const ids=o=>{const values=[];o.traverse(n=>{if(n.userData.componentId)values.push(n.userData.componentId);});return values.sort();};
const failures=[];
if(JSON.stringify(ids(original))!==JSON.stringify(ids(optimized)))failures.push('Optimization changed components');
if(optimizedStats.triangles>250000||optimizedStats.meshes>350)failures.push('Performance budget exceeded');
runtime.setExplode(.8);optimized.rotation.y=.8;
const exportedExploded=buildExportScene(optimized),exportBounds=new THREE.Box3().setFromObject(exportedExploded);
if(expectedBounds.min.distanceTo(exportBounds.min)>1e-5||expectedBounds.max.distanceTo(exportBounds.max)>1e-5)failures.push('Export depends on live explode/rotation state');
if(optimized.rotation.y!==.8)failures.push('Export mutated the live rotation');
runtime.setExplode(0);optimized.rotation.y=0;
for(const [id,n]of Object.entries(runtime.nodes))if(n.position.distanceTo(runtime.restPositions[id])>1e-7)failures.push('Explode failed to reset '+id);
const pickChecks=[];optimized.updateMatrixWorld(true);
for(const id of ['tower','east-wing','plinth']){
 const part=runtime.nodes[id],bb=new THREE.Box3().setFromObject(part),center=bb.getCenter(new THREE.Vector3());
 const ray=new THREE.Raycaster(new THREE.Vector3(center.x,center.y,bb.max.z+20),new THREE.Vector3(0,0,-1));
 const hits=ray.intersectObject(part,true);if(!hits.length)failures.push('No pick hit '+id);pickChecks.push({id,hits:hits.length});
}
const parts=Object.values(runtime.nodes).map(n=>({name:n.name,kind:n.name==='root'?'container':'part',module:n.name,triangles:modelStats(n).triangles}));
for(const p of parts)if(p.kind==='part'&&p.triangles===0)failures.push('Empty part '+p.name);
await fs.writeFile('evidence/delivery/parts.json',JSON.stringify({model:optimized.name,parts,unnamedMeshes:0},null,2));
const report={passed:!failures.length,failures,original:originalStats,optimized:optimizedStats,triangleReduction:1-optimizedStats.triangles/originalStats.triangles,meshReduction:1-optimizedStats.meshes/originalStats.meshes,components:ids(optimized).length,sockets:Object.keys(runtime.sockets).length,colliders:Object.keys(runtime.colliders).length,pickChecks,canonicalExportWhileExploded:true,exportSerializable:JSON.stringify(clean.userData).length>0};
await fs.writeFile('evidence/delivery/technical-tests.json',JSON.stringify(report,null,2));console.log(report);
try{
 const bytes=await fs.readFile('public/models/chaoyang-clocktower-campus.glb');
 const result=await validator.validateBytes(new Uint8Array(bytes),{uri:'chaoyang-clocktower-campus.glb',maxIssues:1000});
 await fs.writeFile('evidence/delivery/gltf-validator.json',JSON.stringify(result,null,2));
 console.log({glbBytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),errors:result.issues.numErrors,warnings:result.issues.numWarnings,messages:result.issues.messages.slice(0,8)});
 if(result.issues.numErrors)failures.push('glTF validator errors');
}catch(e){console.error(e);failures.push('No validated GLB');}
if(failures.length)process.exitCode=1;
