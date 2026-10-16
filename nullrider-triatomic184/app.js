/* Browser cockpit. All reads and writes route to the closure's Node 184 gate. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), core=createTriatomic184();
let serial=0, lastReceipt=null, snapshot, spin=0, halted=false, speed=1, last=0, selectedId=184, autoEnabled=false, autoLast=0;
const send=(op,more={})=>core.through184({via:NODE,op,tx:`local-${++serial}`, ...more});
function refresh(){
 const r=core.through184({via:NODE,op:'VIEW'});
 if(!r.accepted)throw Error('NODE_184_VIEW_BLOCKED');
 snapshot=r.snapshot;
 $('occupancy').textContent=`${snapshot.occupied}/${snapshot.capacity}`;
 $('cycle').textContent=String(snapshot.cycle);
 $('quota').textContent=String(snapshot.quotaRemainderTenths>=7?8:7);
 $('renewed').textContent=String(snapshot.renewedTotal);
 $('faults').textContent=String(snapshot.faults);
 $('fingerprint').textContent=snapshot.fingerprint;
 $('logSize').textContent=String(snapshot.logSize);
 $('verdict').textContent=snapshot.verdict;
 $('verdict').className=snapshot.verdict==='STABLE'?'statusok':'statusbad';
 $('gateStatus').textContent='NODE 184 · ROUTED';
 $('cellInfo').textContent=describeCell(selectedId);
}
function describeCell(id){const c=snapshot?.cells?.[id-1];return c?`CELL ${id} :: ${c.band} / SLOT ${c.slot} :: VERSION ${c.version} :: AGE ${c.age} :: HEALTH ${c.health.toFixed(2)} :: ${c.fault?'FAULT':'NORMAL'}`:'INVALID CELL';}
function showReceipt(event){
 lastReceipt=event; $('receipt').textContent=JSON.stringify(event,null,2);
}
function execute(op,more={}){
 const r=send(op,more);
 if(r.accepted){showReceipt(r.event);refresh();}
 else{$('receipt').textContent=JSON.stringify(r,null,2);$('gateStatus').textContent=r.error;}
 return r;
}
$('one').addEventListener('click',()=>execute('RENEW'));
$('auto').addEventListener('click',()=>{autoEnabled=!autoEnabled;autoLast=performance.now();$('auto').textContent=autoEnabled?'↺ AUTO RENEW · ON':'↺ AUTO RENEW · OFF';});
$('ten').addEventListener('click',()=>{for(let i=0;i<10;i++)execute('RENEW');});
$('ninety').addEventListener('click',()=>{for(let i=0;i<90;i++)execute('RENEW');});
$('fault').addEventListener('click',()=>execute('FAULT',{cell:184}));
$('reset').addEventListener('click',()=>execute('RESEED'));
$('pause').addEventListener('click',()=>{halted=!halted;$('pause').textContent=halted?'▶ RESUME':'Ⅱ PAUSE';});
$('speed').addEventListener('input',e=>{speed=Number(e.target.value);$('speedText').textContent=`${speed.toFixed(1)}×`;});
$('inspect').addEventListener('click',()=>{const n=Number($('cellId').value);if(!Number.isInteger(n)||n<1||n>365){$('cellInfo').textContent='INVALID CELL · MUST BE 1–365';return;}selectedId=n;refresh();});
$('copy').addEventListener('click',async()=>{if(!lastReceipt)return;try{await navigator.clipboard.writeText(JSON.stringify(lastReceipt,null,2));$('gateStatus').textContent='RECEIPT COPIED';}catch{$('gateStatus').textContent='COPY UNAVAILABLE';}});

// A perspective projection of three 118-point cyclic assemblies and 11 reserve dots.
const canvas=$('stage'),ctx=canvas.getContext('2d');
const colors=['#ffb66e','#65e9b4','#5cdde8'];
let drag=false,lastX=0,yaw=-.18,pitch=.15;
canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;try{canvas.setPointerCapture(e.pointerId);}catch{}});
canvas.addEventListener('pointerup',()=>drag=false);
canvas.addEventListener('pointercancel',()=>drag=false);
canvas.addEventListener('pointermove',e=>{if(drag){yaw+=(e.clientX-lastX)*.008;lastX=e.clientX;}});
function project(x,y,z,scale,cy,cx){
 const a=yaw+spin*.18,xx=x*Math.cos(a)-z*Math.sin(a),zz=x*Math.sin(a)+z*Math.cos(a);
 const yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch);
 const persp=1/(1+depth*.045);
 return [cx+xx*scale*persp,cy+yy*scale*persp,persp];
}
function line(a,b,color,alpha=1,width=1){ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.globalAlpha=1;}
function draw(now){
 const w=canvas.clientWidth||900,h=canvas.clientHeight||370,dpr=Math.min(2,devicePixelRatio||1);
 if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(!halted)spin+=Math.min(40,now-(last||now))*.00045*speed;last=now;
 if(autoEnabled&&!halted&&now-autoLast>3500/speed){autoLast=now;execute('RENEW');}
 const mid=w/2,cy=h*.48,scale=Math.min(w*.075,47);
 const positions=[-3.9,0,3.9];
 // Draw from the far side first, so the center gate reads as a bridge between branches.
 positions.forEach((center,i)=>{
   const col=colors[i];const group=snapshot.cells.slice(i*118,(i+1)*118);
   const rad=1.48;
   ctx.fillStyle=col; ctx.shadowBlur=20;ctx.shadowColor=col;
   const pcenter=project(center,0,0,scale,cy,mid);
   ctx.beginPath();ctx.arc(pcenter[0],pcenter[1],5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   const dots=[];
   for(let j=0;j<118;j++){
     const theta=2*Math.PI*j/118+spin*(i===1?-.8:1)*(i===2?-1:1);
     const x=center+Math.cos(theta)*rad;
     const z=Math.sin(theta)*.74;
     const y=Math.sin(theta*2+i)*.33 + Math.sin(theta)*.58;
     const p=project(x,y,z,scale,cy,mid);dots.push({p,c:group[j]});
   }
   dots.sort((a,b)=>b.p[2]-a.p[2]);
   for(const {p,c} of dots){ctx.fillStyle=c.fault?'#f26573':col;ctx.globalAlpha=.25+p[2]*.55;ctx.beginPath();ctx.arc(p[0],p[1],(c.id===selectedId?5.2:2.05)*p[2],0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=1;
 });
 const gate=project(0,-.1,0,scale,cy,mid);
 for(const c of [-3.9,3.9])line(project(c,0,0,scale,cy,mid),gate,'#e7bf80',.37,2);
 // Reserve slots: an independent central belt, not a fourth atomic band.
 for(let j=0;j<11;j++){
   const t=Math.PI*2*j/11-spin*.8;
   const p=project(.9*Math.cos(t),1.0*Math.sin(t),.2*Math.sin(t),scale,cy,mid);
   ctx.beginPath();ctx.fillStyle='#b6a9ff';ctx.arc(p[0],p[1],3,0,Math.PI*2);ctx.fill();
 }
 ctx.shadowBlur=26;ctx.shadowColor='#ffc27c';ctx.fillStyle='#f8c984';ctx.beginPath();ctx.arc(gate[0],gate[1],7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillStyle='#ffe5bd';ctx.fillText('184',gate[0],gate[1]+26);
 requestAnimationFrame(draw);
}
refresh();requestAnimationFrame(draw);
window.__NR184_TEST__=Object.freeze({through184:packet=>core.through184(packet),getSnapshot:()=>core.through184({via:NODE,op:'VIEW'}).snapshot});
})();
