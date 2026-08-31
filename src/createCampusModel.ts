import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import blueprint from '../object-sculpt-spec.json';
import {batchCampus,modelStats,addPortableTangents} from './modelDelivery';

export type CampusSpec = typeof blueprint;
type Component = CampusSpec['componentTree'][number];
type V3 = [number,number,number];
export function createCampusModel(spec: CampusSpec = blueprint, options: {stage?:number,optimize?:boolean} = {}) {
  const optimized=options.optimize!==false;
  const stage = Math.min(options.stage ?? spec.campusBlueprint.activeStage, spec.campusBlueprint.activeStage);
  const root = new THREE.Group(); root.name='ChaoyangClocktowerCampus';
  const nodes:Record<string,THREE.Group>={}, mats:Record<string,THREE.MeshStandardMaterial>={};
  const colliders:Record<string,unknown>={}, sockets:Record<string,THREE.Object3D>={};
  const materialColors:Record<string,string>={stone:'#dfcfb0',trim:'#f0dfba',brick:'#bd6744',roof:'#a76450',foliage:'#a7b44f',grass:'#929f40',glass:'#88a6aa',paving:'#e8d6b7',base:'#caaa7c',road:'#b8aea0',metal:'#6d6b60',bark:'#897040',joint:'#b9a58a',tileSeam:'#885441',white:'#fff9e9',yellow:'#e8bf6c',skin:'#deb08a',blue:'#678ca0',rose:'#b66862',leafLight:'#bbc560'};
  // Initial flat palette supports massing review. Material-pass replaces it with reference-derived maps.
  for(const [id,color] of Object.entries(materialColors))mats[id]=new THREE.MeshStandardMaterial({color,roughness:id==='glass'?.3:.85});
  for(const [id,material] of Object.entries(mats))material.name=id;
  const textureJobs:Promise<unknown>[]=[],textures:THREE.Texture[]=[];
  if(stage>=3){
    mats.leafLight.color.set('#aab544');
    const loader=typeof document!=='undefined'?new THREE.TextureLoader():null;
    for(const source of spec.materials){
      const info=source as any,m=mats[source.id];if(!m)continue;
      m.color.set(info.renderColor??source.color);m.roughness=info.roughness.base;m.metalness=info.metalness.base;
      if(!loader||!info.referencePbr?.usable)continue;
      for(const [channel,slot] of [['roughness','roughnessMap'],['normal','normalMap'],['ao','aoMap']] as const){
        const uri=info.referencePbr.maps[channel].url;
        textureJobs.push(loader.loadAsync(uri).then(t=>{t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;textures.push(t);m[slot]=t;m.needsUpdate=true;}));
      }
      m.roughness=source.id==='glass'?.4:1;m.normalScale.setScalar(source.id==='glass'?.018:.09);m.aoMapIntensity=.15;
    }
  }
  root.userData.assetsReady=textureJobs.length===0;
  Promise.all(textureJobs).then(()=>{root.userData.assetsReady=true;}).catch(e=>{root.userData.assetError=String(e);});
  const grey=new THREE.MeshStandardMaterial({color:'#d8cdbb',roughness:.9});
  function mesh(g:THREE.BufferGeometry,mat:string,parent:THREE.Object3D,p:V3=[0,0,0],scale?:V3){
    if(stage>=3){
      const pos=g.getAttribute('position'),norm=g.getAttribute('normal'),uv=[];
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i)*(scale?.[0]??1),y=pos.getY(i)*(scale?.[1]??1),z=pos.getZ(i)*(scale?.[2]??1);
        const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
        uv.push(...(ny>nx&&ny>nz?[x/2,z/2]:nx>nz?[z/2,y/2]:[x/2,y/2]));
      }
      g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    }
    const m=new THREE.Mesh(g, mats[mat]??grey);m.position.set(...p);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;
    m.name=`${parent.name}-surface-${parent.children.length}`;m.userData.explodeWithParent=true;parent.add(m);return m;
  }
  function box(parent:THREE.Object3D,size:V3,p:V3,mat:string,r=.03){
    if(size.some(v=>v<=0))throw new Error('Nonpositive box dimension');
    return mesh(r?new RoundedBoxGeometry(...size,optimized?1:2,Math.min(r,...size.map(v=>v/3))):new THREE.BoxGeometry(...size),mat,parent,p);
  }
  function sphere(parent:THREE.Object3D,p:V3,scale:V3,mat='foliage'){
    return mesh(new THREE.SphereGeometry(1,optimized?10:12,optimized?7:8),mat,parent,p,scale);
  }
  function cylinder(parent:THREE.Object3D,a:V3,b:V3,r1:number,r2:number,mat:string){
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
    const m=mesh(new THREE.CylinderGeometry(r2,r1,delta.length(),optimized&&Math.max(r1,r2)<.06?6:9),mat,parent);m.position.copy(va.add(vb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
  }
  function hip(parent:THREE.Object3D,w:number,h:number,d:number,ratio:number){
    const points:THREE.Vector3[]=[];for(const y of [0,h])for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]])points.push(new THREE.Vector3(x*w/2*(y?ratio:1),y,z*d/2*(y?ratio:1)));
    mesh(new ConvexGeometry(points),'roof',parent);
    box(parent,[w+.13,.18,d+.13],[0,.015,0],'trim',.035);
    if(stage>=2){
      if(ratio>.1)box(parent,[w*ratio,.12,d*ratio],[0,h+.04,0],'trim');
      // Genuine sloping courses: interpolate all four edges of the hip, never float decals.
      for(let row=1;row<Math.ceil(h/.18);row++){
        const t=row/Math.ceil(h/.18),s=1-t*(1-ratio),y=t*h+.01;
        for(const z of [-1,1])cylinder(parent,[-w*s/2,y,z*d*s/2],[w*s/2,y,z*d*s/2],.014,.014,'tileSeam');
        for(const x of [-1,1])cylinder(parent,[x*w*s/2,y,-d*s/2],[x*w*s/2,y,d*s/2],.014,.014,'tileSeam');
      }
      for(const z of [-1,1])for(let i=1;i<Math.ceil(w/.22);i++){
        const x=-w/2+w*i/Math.ceil(w/.22);cylinder(parent,[x,.10,z*d/2],[x*ratio,h+.012,z*d*ratio/2],.010,.010,'tileSeam');
      }
      for(const x of [-1,1])for(let i=1;i<Math.ceil(d/.25);i++){
        const z=-d/2+d*i/Math.ceil(d/.25);cylinder(parent,[x*w/2,.10,z],[x*w*ratio/2,h+.012,z*ratio],.010,.010,'tileSeam');
      }
    }
  }
  function arcade(parent:THREE.Object3D,w:number,h:number,d:number,count:number,wall='brick'){
    const bay=w/count,r=bay*.40,spring=h-r-.27;
    for(let i=0;i<count;i++){
      const s=new THREE.Shape();s.moveTo(-bay/2,0);s.lineTo(-bay/2,h);s.lineTo(bay/2,h);s.lineTo(bay/2,0);s.lineTo(r,0);s.lineTo(r,spring);s.absarc(0,spring,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();
      const geo=new THREE.ExtrudeGeometry(s,{depth:.44,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,steps:1,curveSegments:20});
      mesh(geo,wall,parent,[-w/2+bay*(i+.5),0,d/2-.44]);
    }
    box(parent,[w,.18,d],[0,h+.04,0],'trim');
    box(parent,[w,.10,d],[0,.015,0],'paving');
    box(parent,[.30,h,d],[-w/2+.14,h/2,0],wall);box(parent,[.30,h,d],[w/2-.14,h/2,0],wall);
  }
  function windowPane(parent:THREE.Object3D,x:number,y:number,w:number,h:number,z=0,arched=false){
    if(arched){const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2-w/2);s.absarc(0,h/2-w/2,w/2,0,Math.PI,false);s.closePath();mesh(new THREE.ExtrudeGeometry(s,{depth:.035,bevelEnabled:false,curveSegments:20}),'glass',parent,[x,y,z]);
      const curve=new THREE.EllipseCurve(0,0,w/2+.045,w/2+.045,0,Math.PI,false,0).getPoints(24).map(p=>new THREE.Vector3(p.x+x,p.y+y+h/2-w/2,z+.035));
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),24,.035,6,false),'trim',parent);
    }else box(parent,[w,h,.055],[x,y,z],'glass',.005);
    box(parent,[.045,h,.072],[x,y,z+.045],'trim',0);
    for(const dy of [-h/2+.04,0,h/2-.03])if(!arched||dy<=0)box(parent,[w+.08,.05,.075],[x,y+dy,z+.05],'trim',0);
    for(const dx of [-w/2-.035,w/2+.035])box(parent,[.07,arched?h-w/2:h,.10],[x+dx,y-(arched?w/4:0),z+.025],'trim',.01);
    box(parent,[w+.20,.10,.20],[x,y-h/2-.06,z+.03],'trim',.02);
  }
  function windows(parent:THREE.Object3D,w:number,h:number,cols:number,rows:number){
    const pitch=w/cols,ypitch=h/rows;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)windowPane(parent,-w/2+pitch*(i+.5),j*ypitch+ypitch*.45,Math.min(.67,pitch*.56),ypitch*.72,0);
  }
  function arcTrim(parent:THREE.Object3D,x:number,spring:number,r:number,z:number){
    const s=new THREE.Shape();s.absarc(0,0,r+.075,0,Math.PI,false);s.absarc(0,0,r,Math.PI,0,true);s.closePath();mesh(new THREE.ExtrudeGeometry(s,{depth:.09,bevelEnabled:false,curveSegments:24}),'trim',parent,[x,spring,z]);
    for(const dx of [-r,r]){box(parent,[.13,spring,.19],[x+dx,spring/2,z+.04],'trim',.02);box(parent,[.25,.12,.28],[x+dx,spring,z+.06],'trim');box(parent,[.24,.12,.26],[x+dx,.06,z+.06],'trim');}
  }
  function build(c:Component,g:THREE.Group){
    const {width:w,height:h,depth:d}=c.dimensions;const cfg=c.campus as any;
    switch(cfg.kind){
      case 'container':return;
      case 'plinth':box(g,[w,h,d],[0,0,0],'base',.65);box(g,[w-.18,.18,d-.18],[0,h/2-.04,0],'paving',.56);break;
      case 'garden-base':box(g,[w,h,d],[0,0,0],'grass',.30);break;
      case 'road':box(g,[w,h,d],[0,0,0],'road',.07);break;
      case 'wing':box(g,[w,h,d],[0,0,0],'stone',.06);box(g,[w+.15,.24,d+.15],[0,h/2-.06,0],'trim');break;
      case 'tower':box(g,[w,h,d],[0,0,0],'stone',.055);box(g,[w+.25,.23,d+.25],[0,h/2-.04,0],'trim');break;
      case 'turret':box(g,[w,h,d],[0,0,0],'stone',.06);box(g,[w+.2,.20,d+.2],[0,h/2-.02,0],'trim');if(stage>=1)for(const y of [-1.4,0,1.4])windowPane(g,0,y,.26,.50,d/2+.025);break;
      case 'hip':hip(g,w,h,d,cfg.topRatio??.6);break;
      case 'arcade':{
        const count=cfg.count??3;arcade(g,w,h,d,count);
        if(stage>=1)for(let i=0;i<count;i++){const bay=w/count,x=-w/2+bay*(i+.5),r=bay*.4;arcTrim(g,x,h-r-.27,r,d/2+.012);if(cfg.glazed)windowPane(g,x,h*.43,bay*.72,h*.83,d/2-.065,true);else{box(g,[bay*.60,h*.73,.09],[x,h*.36,-d/2+.03],'bark');windowPane(g,x,h*.48,bay*.51,h*.59,-d/2+.09,true);}}
        break;
      }
      case 'windows':windows(g,w,h,cfg.columns,cfg.rows);break;
      case 'side-windows':g.rotation.y=cfg.side==='east'?Math.PI/2:-Math.PI/2;windows(g,w,h,cfg.columns,cfg.rows);break;
      case 'piers':for(let i=0;i<=5;i++)box(g,[.20,h,.22],[-w/2+i*w/5,h/2,0],'trim',.025);box(g,[w+.10,.24,.38],[0,0,.04],'trim');box(g,[w+.12,.18,.32],[0,h,.04],'trim');break;
      case 'dormers':for(let i=0;i<cfg.count;i++){const x=(i-(cfg.count-1)/2)*w/(cfg.count+1);box(g,[.53,h,.65],[x,h*.43,0],'stone');box(g,[.70,.20,.87],[x,h*.91,.01],'trim');windowPane(g,x,h*.42,.23,h*.55,.35);}break;
      case 'parapet':for(const z of [-d/2,d/2]){box(g,[w,.23,.25],[0,0,z],'trim');for(const x of [-w/2,0,w/2])box(g,[.65,.43,.58],[x,.16,z],'trim');}for(const x of [-w/2,w/2])box(g,[.25,.24,d],[x,0,0],'trim');break;
      case 'clock':{
        box(g,[w+ .38,h+.38,.18],[0,0,.01],'trim');
        const dial=mesh(new THREE.CylinderGeometry(w*.46,w*.46,.07,48),'paving',g,[0,0,.15]);dial.rotation.x=Math.PI/2;
        mesh(new THREE.TorusGeometry(w*.47,.042,8,48),'bark',g,[0,0,.20]);
        for(let i=0;i<12;i++){const a=i*Math.PI/6,m=box(g,[i%3===0?.045:.03,.105,.025],[Math.sin(a)*w*.38,Math.cos(a)*w*.38,.208],'metal',0);m.rotation.z=-a;}
        const hour=box(g,[.047,w*.27,.027],[0,w*.12,.24],'metal',.01);hour.rotation.z=-.20;
        const minute=box(g,[.035,w*.36,.035],[0,w*.16,.23],'metal',.01);minute.rotation.z=-1.16;
        sphere(g,[0,0,.245],[.055,.055,.025],'metal');break;
      }
      case 'arched-window':windowPane(g,0,0,w,h,0,true);for(const j of [-.75,-.25,.25,.75])box(g,[w,.033,.06],[0,j, .05],'trim',0);break;
      case 'balcony':{
        box(g,[w+.25,.22,d+.18],[0,h,0],'trim');box(g,[w,.19,d],[0,.45,0],'trim');
        const upper=new THREE.Group();upper.name='balcony-upper-arches';upper.position.y=.50;g.add(upper);arcade(upper,w,h-.5,d,2,'stone');
        for(const x of [-w*.22,w*.22]){box(g,[w*.44,.12,.15],[x,.93,d/2],'trim');for(let i=0;i<7;i++)cylinder(g,[x-w*.19+i*w*.063,.54,d/2],[x-w*.19+i*w*.063,.90,d/2],.025,.025,'trim');}
        for(const x of [-w/2,w/2])box(g,[.18,.65,d],[x,.74,0],'stone');break;
      }
      case 'stairs':for(let i=0;i<cfg.count;i++){const depth=d*(cfg.count-i)/cfg.count;box(g,[w,h*(i+1)/cfg.count,depth],[0,h*(i+1)/cfg.count/2,-d/2+depth/2],'trim',.018);}for(const x of [-w/2-.15,w/2+.15])for(let i=0;i<4;i++)box(g,[.30,.28+h*i/4,d/4],[x,(.28+h*i/4)/2,d/2-(i+.5)*d/4],'stone',.04);break;
      case 'pavement':box(g,[w,h,d],[0,0,0],'paving');if(stage>=2){for(let x=-w/2+.5;x<w/2;x+=.5)box(g,[.012,.006,d],[x,h/2+.005,0],'joint',0);for(const z of [-.5,0,.5])box(g,[w,.006,.012],[0,h/2+.005,z],'joint',0);}break;
      case 'hedges':{
        const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-w*.46,0,-d*.4),new THREE.Vector3(-w*.47,0,d*.3),new THREE.Vector3(-w*.25,0,d*.5),new THREE.Vector3(w*.3,0,d*.50),new THREE.Vector3(w*.45,0,d*.25),new THREE.Vector3(w*.42,0,-d*.4)],false,'catmullrom',.2);
        for(let i=0;i<=48;i++){const p=curve.getPoint(i/48);box(g,[.32,.25,.37],[p.x,.0,p.z],'trim',.08);sphere(g,[p.x,.34,p.z],[.36,.38,.36],'grass');}
        box(g,[w*.68,.05,d*.64],[0,.06,0],'grass',.1);break;
      }
      case 'tree':{
        cylinder(g,[0,-.05,0],[0,h*.70,0],.27,.12,'bark');
        for(let i=0;i<6;i++){const a=i*2.4;const y=h*(.40+i*.085),x=Math.sin(a)*w*.23,z=Math.cos(a)*d*.23;cylinder(g,[0,y-.6,0],[x,y+.15,z],.12,.06,'bark');sphere(g,[x,y,z],stage>=2?[.73,.44,.68]:[w*.40,stage>=1?.48:h*.19,d*.40]);if(stage>=1)for(let j=0;j<(stage>=2?11:3);j++){const b=a+j*2.09;const radial=stage>=2?.72+(j%3)*.15:.70;sphere(g,[x+Math.cos(b)*radial,y+.07+(j%3)*.16,z+Math.sin(b)*radial*.87],stage>=2?[.40,.34,.40]:[.82,.45,.72],stage>=2&&j%3===0?'leafLight':'foliage');}}
        break;
      }
      case 'plaque':{
        box(g,[w,h,d],[0,0,0],'trim',.12);box(g,[w-.20,h-.16,.03],[0,0,d/2+.012],'paving',.07);
        // The lettering is re-typeset; it is not claimed to be the official logo artwork.
        if(typeof document!=='undefined'){
          const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=256;const ctx=canvas.getContext('2d')!;
          ctx.fillStyle='#eedcba';ctx.fillRect(0,0,1536,256);ctx.fillStyle='#967c57';ctx.font='110px "Microsoft JhengHei", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('朝陽科技大學',850,133);
          ctx.fillStyle='#83a7a9';ctx.beginPath();ctx.arc(200,150,55,Math.PI,0);ctx.fill();ctx.strokeStyle='#d7a751';ctx.lineWidth=14;for(let i=0;i<9;i++){const a=Math.PI+i*Math.PI/8;ctx.beginPath();ctx.moveTo(200+Math.cos(a)*66,150+Math.sin(a)*66);ctx.lineTo(200+Math.cos(a)*90,150+Math.sin(a)*90);ctx.stroke();}
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(w-.24,h-.20),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));label.position.z=d/2+.03;label.name=c.id+'-lettering';label.userData.explodeWithParent=true;g.add(label);
        }
        break;
      }
      case 'shrubs':{
        for(let i=0;i<12;i++){const x=Math.sin(i*2.39)*w*.43,z=Math.cos(i*1.7)*d*.4;sphere(g,[x,.18,z],[.35,.33,.30],i%3?'grass':'foliage');if(i%2===0)sphere(g,[x+.1,.36,z+.15],[.055,.055,.055],'rose');}
        for(const x of [-w*.25,w*.25]){cylinder(g,[x,0,0],[x,1.18,0],.11,.05,'bark');for(let j=0;j<5;j++){const a=j*2.4;sphere(g,[x+Math.sin(a)*.32,1.15+j*.08,Math.cos(a)*.25],[.47,.32,.41],j%2?'foliage':'leafLight');}}
        break;
      }
      case 'lamps':for(const x of [-10,-5.3,5.3,9.7]){
        cylinder(g,[x,0,0],[x,.09,0],.14,.14,'metal');cylinder(g,[x,.05,0],[x,1.62,0],.043,.029,'metal');
        box(g,[.22,.30,.22],[x,1.61,0],'yellow',.018);const cap=mesh(new THREE.ConeGeometry(.21,.17,4),'metal',g,[x,1.845,0]);cap.rotation.y=Math.PI/4;
        for(const dx of [-.11,.11])for(const z of [-.11,.11])cylinder(g,[x+dx,1.45,z],[x+dx,1.77,z],.014,.014,'metal');
        cylinder(g,[x,.95,0],[x+.30,.95,0],.025,.025,'metal');box(g,[.21,.37,.025],[x+.26,.80,0],'blue',.012);
      }break;
      case 'people':for(let i=0;i<9;i++){
        const x=-9.1+i*2.35,z=Math.sin(i*3.1)*.25,body=i%3===0?'rose':i%3===1?'blue':'grass';
        sphere(g,[x,.50,z],[.14,.16,.135],'skin');sphere(g,[x,.575,z-.015],[.145,.09,.13],i%2?'bark':'base');
        sphere(g,[x,.25,z],[.105,.15,.085],body);
        for(const side of [-1,1]){cylinder(g,[x+side*.05,.19,z],[x+side*.067,.045,z+side*.03],.035,.035,'blue');sphere(g,[x+side*.065,.025,z+.03],[.045,.035,.068],'bark');cylinder(g,[x+side*.085,.32,z],[x+side*.13,.17,z+.02],.03,.03,'skin');}
      }break;
      case 'markings':{
        // World road top is y=.15; offset relative to this component's authored transform.
        const y=.159-c.transform.position[1],z=7.65-c.transform.position[2];
        for(const x of [-10,0,8.5])for(let i=0;i<5;i++)box(g,[1.4,.012,.19],[x,y,z-.75+i*.36],'white',0);
        for(let x=-12;x<13;x+=2)if(Math.abs(x)>.95)box(g,[1.05,.01,.035],[x,y+.002,z],'yellow',0);
        break;
      }
      case 'sign':box(g,[w,h,d],[0,h/2,0],'trim',.06);box(g,[w*.76,h*.65,.03],[0,h*.56,d/2+.02],'paving');sphere(g,[0,h*.60,d/2+.05],[.27,.27,.025],'yellow');sphere(g,[0,h*.49,d/2+.065],[.30,.13,.025],'blue');box(g,[w+ .35,.30,.7],[0,.15,0],'brick',.07);for(let i=0;i<5;i++)sphere(g,[-.48+i*.24,.35,.15],[.15,.15,.13],'foliage');break;
      case 'relief':{
        const p=spec.componentTree.find(x=>x.id===c.parent)!;const pw=p.dimensions.width,ph=p.dimensions.height,pd=p.dimensions.depth;
        if(c.id==='roof-tiles')for(const x of [-1,1])cylinder(g,[x*pw/2,.12,pd/2],[x*pw*(p.campus as any).topRatio/2,ph+.03,pd*(p.campus as any).topRatio/2],.04,.04,'roof');
        if(c.id==='brick-joints')for(let y=2.4;y<ph;y+=.20)box(g,[pw,.013,.012],[0,y,pd/2+.032],'tileSeam',0);
        if(c.id==='stone-joints')for(let y=-ph/2+.6;y<ph/2;y+=.72){box(g,[pw,.013,.009],[0,y,pd/2+.058],'joint',0);box(g,[.01,.013,pd],[pw/2+.058,y,0],'joint',0);}
        if(c.id==='clock-marks'){
          const s=new THREE.Shape();s.moveTo(-pw*.64,ph*.48);s.lineTo(0,ph*.95);s.lineTo(pw*.64,ph*.48);s.closePath();mesh(new THREE.ExtrudeGeometry(s,{depth:.20,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:1}),'trim',g,[0,0,-.04]);
          for(let i=0;i<60;i++)if(i%5){const a=i*Math.PI/30,m=box(g,[.013,.035,.016],[Math.sin(a)*pw*.405,Math.cos(a)*pw*.405,.207],'bark',0);m.rotation.z=-a;}
        }
        if(c.id==='balustrade')for(const x of [-pw*.48,pw*.48])box(g,[.18,.20,.22],[x,1,pd/2],'trim');
        if(c.id==='window-mullions')for(let j=0;j<3;j++)for(let i=0;i<5;i++)box(g,[.035,.95,.03],[-pw/2+pw/5*(i+.5),ph/3*(j+.45),.10],'trim',0);
        break;
      }
    }
  }
  for(const c of spec.componentTree){
    if(c.campus.stage>stage)continue;
    const g=new THREE.Group();g.name=c.id;g.position.fromArray(c.transform.position);g.userData.componentId=c.id;g.userData.label=c.name;g.userData.actionProfile=c.actionProfile;
    nodes[c.id]=g;(c.parent&&nodes[c.parent]?nodes[c.parent]:root).add(g);colliders[c.id]=c.actionProfile.collider;
    const socket=new THREE.Object3D();socket.name=c.id+':assembly-origin';g.add(socket);sockets[socket.name]=socket;build(c,g);
  }
  root.updateMatrixWorld(true);
  const unbatchedStats=modelStats(root);if(optimized){batchCampus(root);if(stage>=3)addPortableTangents(root,new Set(spec.materials.filter(m=>(m as any).referencePbr?.usable).map(m=>m.id)));}
  const rest:Record<string,THREE.Vector3>={};for(const [id,n]of Object.entries(nodes))rest[id]=n.position.clone();
  root.userData.sculptRuntime={nodes,colliders,sockets,stage,restPositions:rest,optimized,unbatchedStats,stats:modelStats(root),
    setExplode(amount:number){for(const[id,n]of Object.entries(nodes)){const c=spec.componentTree.find(c=>c.id===id)!;n.position.copy(rest[id]);if(c.parent==='root')n.position.addScaledVector(rest[id].clone().sub(new THREE.Vector3(0,3.5,0)),amount*.55);}},
    tick(_time:number){},
    dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),allTextures=new Set<THREE.Texture>(textures);root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)allTextures.add(value);}}});geometries.forEach(g=>g.dispose());allTextures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());Object.values(mats).forEach(m=>m.dispose());grey.dispose();}
  };
  return root;
}
