import {createMadrePrimeTower,MADRE} from './madre.mjs';
const $=id=>document.getElementById(id);
const tower=createMadrePrimeTower();let sequence=0,lastReceipt=null,angle=0,paused=false,lastTick=0,orbit=.58;
const thru=(op,extra={})=>tower.through184({via:184,op,...extra});
const tx=()=>`madre-${++sequence}`;
const safeText=(id,text)=>{$(id).textContent=String(text)};
function update(){const v=thru('VIEW');const s=v.stats;
 safeText('m-base',MADRE.base);safeText('m-full',`${s.occupied}/${s.capacity}`);safeText('m-cycle',s.cycle);safeText('m-faults',s.faults);safeText('occupancy',`${s.fullness}%`);
 const labels=v.receipts.slice(-6).reverse().map(r=>`#${r.serial} · ${r.verdict} · ${r.byteLength} bytes · ${r.turns*360}°`).join('\n');
 safeText('ledger',labels||'No crossings yet.');}
function show(id,value,bad=false){$(id).textContent=value;$(id).className='status '+(bad?'bad': 'neutral');}
const hex=v=>v.toString(16).padStart(2,'0');
function matrices(a,b){for(const [id,m] of [['matrixA',a],['matrixB',b]]){
  const panel=$(id);panel.replaceChildren();if(!m)continue;
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){
    const el=document.createElement('span');el.textContent=hex(m[i][j]);el.title=`${i},${j} = ${m[i][j]}`;
    if(m[i][j]!==0)el.classList.add('hit');if(id==='matrixB'&&window.__faultVisual&&i===0&&j===0)el.classList.add('fault');panel.append(el);
  }
 }}
const init=thru('PREVIEW',{cargo:$('cargo').value,turns:0});matrices(init.matrixA,init.matrixB);update();
function swap(injectFault=false){const turns=angle<180?0:angle<540?1:2;
 const packet=thru('SWAP',{tx:tx(),cargo:$('cargo').value,turns,injectFault});
 if(packet.receipt){lastReceipt=packet.receipt;window.__faultVisual=injectFault;matrices(packet.matrixA,packet.matrixB);
   show('swap-status',`${packet.receipt.verdict} · ${packet.receipt.byteLength} bytes · ${packet.receipt.blocks} block(s) · ${packet.receipt.crossings} crossing(s) · spinor ${packet.receipt.spinorSign>0?'+':'−'}1`,!packet.accepted);
 }else show('swap-status',packet.error||'REJECT',true);update();}
$('swap').onclick=()=>swap(false);$('fault-swap').onclick=()=>swap(true);
$('copy-receipt').onclick=()=>{if(lastReceipt&&navigator.clipboard?.writeText)navigator.clipboard.writeText(JSON.stringify(lastReceipt,null,2)).then(()=>show('swap-status','Copied local receipt.'),()=>show('swap-status','Clipboard unavailable.',true));else show('swap-status','No receipt or clipboard permission.',true)};
$('renew').onclick=()=>{const r=thru('RENEW',{tx:tx()});show('renew-status',r.accepted?`Cycle ${r.stats.cycle} · renewed ${r.event.details.quota}, occupied ${r.stats.occupied}`:r.error,!r.accepted);update();};
$('renew10').onclick=()=>{let total=0,last;for(let i=0;i<10;i++){last=thru('RENEW',{tx:tx()});if(!last.accepted)break;total+=last.event.details.quota;}show('renew-status',last?.accepted?`10 cycles · ${total} renewals · ${last.stats.occupied}/365 occupied`:(last?.error||'ERROR'),!last?.accepted);update();};
$('fault-cell').onclick=()=>{const r=thru('FAULT',{tx:tx(),cell:184});show('renew-status',r.accepted?`Physical cell 184 flagged · await renewal`:`${r.error}`,!r.accepted);update();};
$('infer').onclick=()=>{const r=thru('INFER');if(r.accepted){safeText('m-infer',r.count);show('infer-status',`Observed ${r.count} cells · ALERT ${r.counts.ALERT} · CLEAR ${r.counts.CLEAR} · ABSTAIN ${r.counts.ABSTAIN} · core unchanged ${r.coreUnchanged}`);}else show('infer-status',r.error,true);};
$('inspect-184').onclick=()=>{const r=thru('LOCATE',{address:184});show('infer-status',r.accepted?`Tower address 184: ${r.branch}, slot ${r.slot}, core cell ${r.cellId}. This is NOT gateway 184.`:r.error,!r.accepted);};
$('inspect-zero').onclick=()=>{const r=thru('LOCATE',{address:366});show('infer-status',r.accepted?`Tower position 366 :: ${r.kind}, scalar ${r.scalar} · non-renewable, no core cell ID.`:r.error,!r.accepted);};
function setAngle(v){angle=Number(v);$('spin').value=String(angle);const turns=Math.floor(angle/360),sign=turns%2?'−1':'+1';safeText('angle-caption',`${Math.round(angle)}° · ${sign}`);}
$('spin').oninput=e=>setAngle(e.target.value);$('turn360').onclick=()=>setAngle(360);$('turn720').onclick=()=>setAngle(720);$('reset-angle').onclick=()=>setAngle(0);
$('pause').onclick=()=>{paused=!paused;safeText('pause',paused?'Resume cruise':'Pause cruise');safeText('state-pill',paused?'● HOLD · PAUSED':'● CRUISE · READY')};
// Dependency-free 3D perspective software rendering. No external scripts required.
const canvas=$('tower-view'),ctx=canvas.getContext('2d');
function resize(){const dpr=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();const w=Math.max(240,Math.round(rect.width)),h=Math.max(300,Math.round(rect.height));if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=w*dpr;canvas.height=h*dpr}ctx.setTransform(dpr,0,0,dpr,0,0);return {w,h};}
function project(x,y,z,w,h){const c=Math.cos(orbit),s=Math.sin(orbit);const xr=x*c+z*s,zr=z*c-x*s,scale=340/(340+zr+155);return {x:w*.5+xr*scale,y:h*.52-y*scale,scale,depth:zr};}
function line3(points,color,alpha,w,h,width=1){if(points.length<2)return;ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.beginPath();let p=project(...points[0],w,h);ctx.moveTo(p.x,p.y);for(let i=1;i<points.length;i++){p=project(...points[i],w,h);ctx.lineTo(p.x,p.y)}ctx.stroke();ctx.globalAlpha=1;}
function draw(time){if(!paused&&lastTick){orbit+=Math.min(.028,(time-lastTick)*.00016);angle=(angle+(time-lastTick)*.008)%720;setAngle(angle)}lastTick=time;
 const {w,h}=resize();ctx.clearRect(0,0,w,h);const scale=Math.min(w/550,h/500);ctx.save();ctx.translate(w/2,h/2);ctx.scale(scale,scale);ctx.translate(-w/2,-h/2);
 const phase=angle*Math.PI/180;
 const armColors=['#ffb66a','#64d7e8','#a59aff'];
 // The vertical spire rings are decorative fixed symbols, not partitions of 366.
 for(let k=0;k<7;k++){
  const y=150-k*42,rad=53+((6-k)%3)*11;
  line3(Array.from({length:90},(_,i)=>{const t=i/89*Math.PI*2;return [rad*Math.cos(t),y-145,rad*Math.sin(t)]}),k%2?'#48778a':'#3d6e76',.55,w,h,1.2);
 }
 // Three 122-slot strands, colored by engine band.
 const pts=[];for(let b=0;b<3;b++)for(let i=0;i<122;i++){
   const t=i/121,th=phase*.45+b*Math.PI*2/3+t*Math.PI*2*2.35;
   const r=72+6*Math.sin(t*8);const p=project(r*Math.cos(th),110-t*275,r*Math.sin(th),w,h);
   pts.push({...p,b,i});
 }
 pts.sort((a,b)=>b.depth-a.depth);
 for(const p of pts){ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.1,2.2*p.scale),0,Math.PI*2);ctx.fillStyle=armColors[p.b];ctx.globalAlpha=p.i>117?.5:.85;ctx.fill();}ctx.globalAlpha=1;
 // Solar A/B Möbius-style display loops (the data transformation itself is in engine.mjs).
 for(const side of [-1,1]){
  const curve=[];for(let i=0;i<=160;i++){
    const t=i/160*Math.PI*2,rad=51+8*Math.cos(t/2+phase*.2);
    curve.push([side*153+rad*Math.cos(t),25+rad*.42*Math.sin(t),rad*.35*Math.sin(t)]);
  }line3(curve,side<0?'#ffb66a':'#64d7e8',.75,w,h,2);
 }
 const centre=project(0,-20,0,w,h);ctx.beginPath();ctx.arc(centre.x,centre.y,9,0,Math.PI*2);ctx.fillStyle='#51e0ab';ctx.shadowColor='#41c89a';ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;
 ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillStyle='#b5ffdf';ctx.fillText('184',centre.x,centre.y-16);
 ctx.font='10px monospace';ctx.fillStyle='#c7dfdf';ctx.fillText('SCALAR 0 · OPEN',centre.x,centre.y+30);
 ctx.fillStyle='#ffbd78';ctx.fillText('CUBI A',w*.2,30);ctx.fillStyle='#8ee8f3';ctx.fillText('CUBI B',w*.8,30);
 ctx.restore();requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
