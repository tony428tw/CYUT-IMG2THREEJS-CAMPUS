import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {exportCampusGLB,modelStats} from './modelDelivery';
import {createCampusModel} from './createCampusModel';
import spec from '../object-sculpt-spec.json';
import './style.css';

const params=new URLSearchParams(location.search),review=params.has('review');
const exportButton=document.querySelector<HTMLButtonElement>('#download')!;
exportButton.disabled=true;exportButton.textContent='載入模型材質…';
document.querySelector('.intro')!.textContent='程序化模型 · GLB 與互動預覽';
if(review)document.body.classList.add('review');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
document.querySelector('#scene')!.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label','可互動的鐘樓校園三維模型');
const scene=new THREE.Scene();scene.background=new THREE.Color('#f8f3e9');
const camera=new THREE.OrthographicCamera(-20,20,12,-12,.1,200);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=12;controls.maxDistance=100;controls.minZoom=.5;controls.maxZoom=4;
let interactive=false,spin=false;
controls.addEventListener('start',()=>{interactive=true;spin=false;document.querySelector('#spin')!.setAttribute('aria-pressed','false');});
const model=params.get('asset')==='glb'?(await new GLTFLoader().loadAsync('/models/chaoyang-clocktower-campus.glb')).scene:createCampusModel(spec,{optimize:params.get('optimize')!=='0'});
if(params.get('asset')==='glb'){
  const nodes:Record<string,THREE.Object3D>={},rest:Record<string,THREE.Vector3>={};
  model.traverse(o=>{if(o.userData.componentId){nodes[o.userData.componentId]=o;rest[o.userData.componentId]=o.position.clone();}if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  model.userData.assetsReady=true;
  model.userData.sculptRuntime={nodes,restPositions:rest,stats:modelStats(model),setExplode(amount:number){for(const [id,n]of Object.entries(nodes)){n.position.copy(rest[id]);if(n.parent?.userData.componentId==='root')n.position.addScaledVector(rest[id].clone().sub(new THREE.Vector3(0,3.5,0)),amount*.55);}},dispose(){model.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v instanceof THREE.Texture)v.dispose();m.dispose();}}});}};
}
scene.add(model);
let dirty=true;function invalidate(){dirty=true;renderer.shadowMap.needsUpdate=true;}
controls.addEventListener('change',invalidate);document.querySelector('#inspector')!.addEventListener('input',invalidate);document.querySelector('#inspector')!.addEventListener('change',invalidate);document.querySelector('#inspector')!.addEventListener('click',invalidate);addEventListener('resize',invalidate);
const hemisphere=new THREE.HemisphereLight('#fff8e5','#c1b9a0',1.6);scene.add(hemisphere);
const key=new THREE.DirectionalLight('#fff0d4',3.4);key.position.set(-12,23,16);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:.1,far:80});key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight('#dce7ee',1.0);fill.position.set(15,10,-12);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#81786b',opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.23;floor.receiveShadow=true;scene.add(floor);
if(params.has('silhouette')){scene.background=new THREE.Color('#ffffff');floor.visible=false;model.traverse(o=>{if(o instanceof THREE.Mesh)o.material=new THREE.MeshBasicMaterial({color:'#505050'});});}
if(params.has('isolated')){scene.background=new THREE.Color('#ffffff');floor.visible=false;}
if(params.has('hideMaterial'))model.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material.name===params.get('hideMaterial'))o.visible=false;});
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);const span=review?21.5:23.5;camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
const views:Record<string,[number,number,number]>={match:spec.referenceCamera.positionHint as [number,number,number],front:[0,18,45],right:[45,18,0],rear:[0,18,-45],left:[-45,18,0],top:[.1,50,.1]};
function setView(id:string){interactive=false;model.rotation.y=0;camera.zoom=1;camera.position.set(...(views[id]??views.match));controls.target.set(review?0:1.5,4.4,0);camera.lookAt(controls.target);controls.update();camera.updateProjectionMatrix();}
setView(params.get('view')??'match');
document.querySelector<HTMLSelectElement>('#view')!.onchange=e=>setView((e.target as HTMLSelectElement).value);
document.querySelector<HTMLSelectElement>('#lighting')!.onchange=e=>{const v=(e.target as HTMLSelectElement).value;key.color.set(v==='reference'?'#fff0d4':'#ffffff');key.position.set(...(v==='grazing'?[18,5,12]:[-12,23,16]) as [number,number,number]);hemisphere.intensity=v==='grazing'?.8:1.6;};
if(params.has('light')){const v=params.get('light');key.color.set(v==='reference'?'#fff0d4':'#ffffff');key.position.set(...(v==='grazing'?[18,5,12]:[-12,23,16]) as [number,number,number]);hemisphere.intensity=v==='grazing'?.8:1.6;}
document.querySelector<HTMLInputElement>('#explode')!.oninput=e=>{const value=Number((e.target as HTMLInputElement).value);model.userData.sculptRuntime.setExplode(value/100);document.querySelector('output')!.textContent=value+'%';};
document.querySelector('#spin')!.addEventListener('click',()=>{spin=!spin;document.querySelector('#spin')!.setAttribute('aria-pressed',String(spin));});
document.querySelector('#reset')!.addEventListener('click',()=>{spin=false;document.querySelector('#spin')!.setAttribute('aria-pressed','false');model.userData.sculptRuntime.setExplode(0);document.querySelector<HTMLInputElement>('#explode')!.value='0';document.querySelector('output')!.textContent='0%';setView('match');});
const raycaster=new THREE.Raycaster();let down=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>down.set(e.clientX,e.clientY));
renderer.domElement.addEventListener('pointerup',e=>{if(down.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>5)return;const b=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),camera);const hit=raycaster.intersectObject(model,true)[0];if(hit){let n:THREE.Object3D|null=hit.object;while(n&&!n.userData.componentId)n=n.parent;if(n){document.querySelector('#part-name')!.textContent=n.userData.label;document.querySelector('#part-note')!.textContent=`組件 ${n.userData.componentId} · 獨立樞紐與碰撞範圍`;}}});
let exporting=false;
exportButton.addEventListener('click',async()=>{exporting=true;exportButton.disabled=true;exportButton.textContent='匯出中…';try{const data=await exportCampusGLB(model);const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='chaoyang-clocktower-campus.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){document.querySelector('#part-note')!.textContent='匯出失敗：'+String(e);}finally{exporting=false;exportButton.disabled=false;exportButton.textContent='下載模型 GLB ↗';}});
if(params.has('verify')){
  const panel=document.createElement('section');panel.style.cssText='position:absolute;left:20px;bottom:50px;max-width:620px;background:#fffdf4;padding:16px;font-size:11px;max-height:60vh;overflow:auto';
  const b=document.createElement('button');b.textContent='執行 GLB 驗收';const result=document.createElement('pre');result.id='delivery-report';panel.append(b,result);document.body.append(panel);
  b.onclick=async()=>{b.disabled=true;result.textContent='驗證中…';try{const {verifyDelivery}=await import('./verifyDelivery');result.textContent=JSON.stringify(await verifyDelivery(model),null,2);result.dataset.passed='true';}catch(e){result.textContent=String(e);result.dataset.passed='false';}finally{b.disabled=false;}};
}
const clock=new THREE.Clock();
let settledFrames=0,lastTime=performance.now(),renderCount=0;const timings:number[]=[];
function frame(){requestAnimationFrame(frame);const now=performance.now(),elapsed=now-lastTime;lastTime=now;const dt=Math.min(clock.getDelta(),.05);if(spin){model.rotation.y+=dt*.16;invalidate();}if(interactive)controls.update();
  const ready=model.userData.assetsReady;if(!ready||settledFrames<12||dirty||params.has('benchmark')){renderer.render(scene,camera);renderCount++;dirty=false;if(ready)settledFrames++;}
  if(ready&&settledFrames>10){document.body.dataset.renderReady='true';if(!exporting){exportButton.disabled=false;exportButton.textContent='下載模型 GLB ↗';}}
  document.body.dataset.assetError=model.userData.assetError??'';document.body.dataset.renderCount=String(renderCount);
  let benchmark='';if(params.has('benchmark')&&ready&&settledFrames>60){if(timings.length<180)timings.push(elapsed);if(timings.length===180){const sorted=[...timings].sort((a,b)=>a-b);const report={fps:1000/(timings.reduce((a,b)=>a+b,0)/timings.length),medianMs:sorted[90],p95Ms:sorted[171],frames:180,width:innerWidth,height:innerHeight,dpr:renderer.getPixelRatio(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};document.body.dataset.benchmark=JSON.stringify(report);benchmark=` · ${report.fps.toFixed(1)} FPS`;}}
  const text=`${Object.keys(model.userData.sculptRuntime.nodes).length} 組件 · ${renderer.info.render.triangles.toLocaleString()} 三角形 · ${renderer.info.render.calls} draw calls${benchmark}`;const status=document.querySelector('#status')!;if(status.textContent!==text)status.textContent=text;
}frame();
addEventListener('pagehide',()=>{model.userData.sculptRuntime.dispose();renderer.dispose();renderer.forceContextLoss();});
