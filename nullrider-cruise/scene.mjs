/* Three.js presentation layer. Network dependency only for graphics; verification is local and independent. */
export async function createScene(canvas,status){
  const fallbackCanvas=document.getElementById('fallbackStage');
  const fallback=createFallback(fallbackCanvas);
  status('CANVAS ACTIVE · LOADING THREE.JS');
  let THREE;
  try { THREE = await Promise.race([import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js'),new Promise((_,reject)=>setTimeout(()=>reject(Error('CDN_TIMEOUT')),2200))]); }
  catch(e){status('CANVAS PREVIEW · THREE.JS CDN UNAVAILABLE');return fallback;}
  let renderer;
  try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}
  catch {status('CANVAS PREVIEW · WEBGL UNAVAILABLE');return fallback;}
  fallback.dispose();fallbackCanvas.style.display='none';
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x050915,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,0.1,100); camera.position.set(0,2.2,18);camera.lookAt(0,0,0);
  scene.add(new THREE.AmbientLight(0x8191bf,1.2));
  for(const [color,x,intensity] of [[0xffa849,-4,170],[0x42e2e0,4,170]]){
    const light=new THREE.PointLight(color,intensity,16,2);light.position.set(x,0,3);scene.add(light);
  }
  const root=new THREE.Group();scene.add(root);
  const groupA=new THREE.Group(),groupB=new THREE.Group(); groupA.position.x=-4.15;groupB.position.x=4.15;
  root.add(groupA,groupB);
  function buildSolar(group,color,shellCount){
    const rings=[];
    for(let i=0;i<shellCount;i++){
      const radius=0.74+i*.29;
      const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(radius,2),new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:.17-i*.026,depthWrite:false}));group.add(wire);rings.push(wire);
      const torus=new THREE.Mesh(new THREE.TorusGeometry(radius,0.015,7,120),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.66-i*.11}));
      torus.rotation.x=i*.37;torus.rotation.y=(i%2)*.67;group.add(torus);rings.push(torus);
    }
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.44,3),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.58,metalness:.4,roughness:.2,transparent:true,opacity:.94}));group.add(core);
    const inner=new THREE.Mesh(new THREE.TorusKnotGeometry(.59,.068,120,9,2,5),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));group.add(inner);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(2.13,.012,7,160),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.22}));group.add(halo);
    return {rings,core,inner,halo};
  }
  const a=buildSolar(groupA,0xffa451,4),b=buildSolar(groupB,0x45dfe6,3);
  const lineMat=new THREE.LineBasicMaterial({color:0x7f9dbc,transparent:true,opacity:.35});
  const axisPoints=[new THREE.Vector3(-2.1,0,0),new THREE.Vector3(2.1,0,0)];
  const axis=new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisPoints),lineMat);scene.add(axis);
  // The zero seam is a separate structure, not a fourth shell of either branch.
  const seam=new THREE.Group();scene.add(seam);
  const seamRod=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,5.7,8),new THREE.MeshBasicMaterial({color:0xc3f0fe,transparent:true,opacity:.4}));seam.add(seamRod);
  const seamRing=new THREE.Mesh(new THREE.TorusGeometry(.79,.026,8,110),new THREE.MeshBasicMaterial({color:0xe7fbff,transparent:true,opacity:.8}));seamRing.rotation.y=Math.PI/2;seam.add(seamRing);
  const seamCore=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));seam.add(seamCore);
  const energy=new THREE.Group();scene.add(energy);
  for(let i=0;i<36;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.017+(i%3)*.005,6,4),new THREE.MeshBasicMaterial({color:i%2?0x48dfed:0xffba63,transparent:true,opacity:.76}));m.userData.phase=i/36;energy.add(m);
  }
  const dustPositions=new Float32Array(150*3);
  for(let i=0;i<150;i++){const n=i*3;dustPositions[n]=(Math.random()-.5)*21;dustPositions[n+1]=(Math.random()-.5)*10;dustPositions[n+2]=(Math.random()-.5)*10;}
  const dust=new THREE.BufferGeometry();dust.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  scene.add(new THREE.Points(dust,new THREE.PointsMaterial({color:0x89bbd8,size:.032,transparent:true,opacity:.57})));
  let sizeW=0,sizeH=0,yaw=0,pitch=0,hold=false,lastX=0,lastY=0,active=false,paused=false,progress=0,verdict='IDLE',speed=1,simT=0,lastFrame=0;
  const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(w===sizeW&&h===sizeH)return;sizeW=w;sizeH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z= w<700?28:18;camera.updateProjectionMatrix();};
  canvas.addEventListener('pointerdown',e=>{hold=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',()=>hold=false);
  canvas.addEventListener('pointermove',e=>{if(!hold)return;yaw+=(e.clientX-lastX)*.004;pitch=Math.max(-.5,Math.min(.5,pitch+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();camera.position.z=Math.max(12,Math.min(30,camera.position.z+Math.sign(e.deltaY)));},{passive:false});
  function frame(now){
    resize();const dt=Math.min(.06,Math.max(0,(now-(lastFrame||now))/1000));lastFrame=now;if(!paused)simT+=dt*speed;const t=simT;
    root.rotation.y=yaw+Math.sin(t*.16)*.06;root.rotation.x=pitch;
    if(!paused){a.rings.forEach((o,i)=>{o.rotation.y+=.0017*speed*(i%2?1:-1);o.rotation.z+=.0006*speed;});
    b.rings.forEach((o,i)=>{o.rotation.y-=.0018*speed*(i%2?1:-1);o.rotation.z-=.0006*speed;});
    a.inner.rotation.x+=.006*speed;b.inner.rotation.x-=.006*speed;}
    a.core.scale.setScalar(1+Math.sin(t*2)*.035);b.core.scale.setScalar(1+Math.sin(t*2+1.4)*.035);
    seamRing.rotation.z=t*.7;
    const glow=active?.7+Math.sin(t*6)*.22:.55;
    seamCore.scale.setScalar(verdict==='ACCEPT'?2.2:verdict==='REJECT'?0.5:glow);
    energy.children.forEach((p,i)=>{
      const side=i%2===0?-1:1;const f=(p.userData.phase +t*.025)%1;
      const x=side*(2.15 - f*2.0);p.position.set(x,Math.sin(i*8+t*2)*.34,Math.cos(i*4+t)*.3);
      p.material.opacity=active?.9:.28;
    });
    renderer.render(scene,camera); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  status('THREE.JS · WEBGL ONLINE');
  return {setState(next){verdict=next;active=next==='CROSSING'||next==='VERIFYING';},setPaused(v){paused=v;},setProgress(n){progress=n;},setCruiseSpeed(n){if(Number.isFinite(n)&&n>=.25&&n<=3)speed=n;}};
}
function createFallback(canvas){
  const ctx=canvas.getContext('2d');let state='IDLE',phase=0,pointer=0,running=true,paused=false,speed=1;
  function frame(){
    if(!running)return;
    const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==width*dpr||canvas.height!==height*dpr){canvas.width=width*dpr;canvas.height=height*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const mid=width/2,cy=height*.49,off=Math.min(width*.275,310);
    for(const [x,color,n,dir] of [[mid-off,'255,169,88',4,1],[mid+off,'65,220,228',3,-1]]){
      const r=Math.min(width*.13,98);const glow=ctx.createRadialGradient(x,cy,5,x,cy,r*2.1);
      glow.addColorStop(0,`rgba(${color},.20)`);glow.addColorStop(1,`rgba(${color},0)`);
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,cy,r*2.1,0,Math.PI*2);ctx.fill();
      for(let i=0;i<n;i++){
        ctx.beginPath();ctx.ellipse(x,cy,r*(.65+i*.29),r*(.50+i*.24),phase*dir*.16+i*.65,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${color},${.8-i*.14})`;ctx.lineWidth=1.4;ctx.stroke();
      }
      ctx.fillStyle=`rgba(${color},.82)`;ctx.beginPath();ctx.arc(x,cy,13,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='rgba(176,230,245,.5)';ctx.beginPath();ctx.moveTo(mid,cy-145);ctx.lineTo(mid,cy+145);ctx.stroke();
    ctx.font='600 20px monospace';ctx.textAlign='center';ctx.fillStyle='#d6f6ff';ctx.fillText('0',mid,cy+5);
    if(!paused)phase+=.018*speed;requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {setState(next){state=next;},setPaused(p){paused=!!p;},setProgress(){},setCruiseSpeed(n){if(Number.isFinite(n)&&n>=.25&&n<=3)speed=n;},dispose(){running=false;}};
}
