import {GATE,packA,swapAtX,viewThroughMobius,checkRestoration,spinorTurns} from './engine.mjs';
const $=id=>document.getElementById(id);
let angle=0,playing=false,last=0,tx=null,fault=false,selected=[2,5],lastReceipt=null;
const enc=new TextEncoder();
const state=()=>({turns:Math.floor(angle/360+1e-10)});
function rebuildVisible(){if(tx){tx.visibleB=viewThroughMobius(tx.packedB,state().turns,GATE);if(fault && tx.visibleB.blocks.length)tx.visibleB.blocks[0][1][2]^=1;}}
function renderMatrices(){
 const [i,j]=selected,turns=state().turns,bc=turns%2?7-i:i;
 $('aMatrix').replaceChildren();$('bMatrix').replaceChildren();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const a=document.createElement('button');a.textContent=String(row*8+col).padStart(2,'0');a.title=`A[${row},${col}]`;
  if(row===i&&col===j)a.classList.add('alit');a.addEventListener('click',()=>{selected=[row,col];renderMatrices();});$('aMatrix').append(a);
  const b=document.createElement('button');b.textContent=String(row*8+col).padStart(2,'0');b.title=`B view[${row},${col}]`;
  if(row===j&&col===bc)b.classList.add('blit');if(tx&&fault&&row===1&&col===2)b.classList.add('fault');
  b.addEventListener('click',()=>{selected=[turns%2?7-col:col,row];renderMatrices();});$('bMatrix').append(b);
 }
 $('mapping').textContent=`A[${i},${j}] → X SWAP → B[${j},${i}] → ${turns%2?'MÖBIUS REVERSE → ':''}VIEW B[${j},${bc}]`;
}
async function sha(bytes){if(globalThis.crypto?.subtle){const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');}return 'unavailable: requires secure origin';}
async function verify(){if(!tx){$('status').textContent='READY';$('status').className='status';$('verdict').textContent='NOT RUN';return;}
 const source=$('cargo').value,bytes=enc.encode(source),result=checkRestoration(source,tx.visibleB,GATE);
 const accepted=result.accepted;
 $('status').textContent=accepted?'PRESERVED':'REJECTED';$('status').className='status '+(accepted?'ok':'bad');$('verdict').textContent=accepted?'ACCEPT':'REJECT';$('verdict').style.color=accepted?'var(--mint)':'var(--bad)';
 const number=(lastReceipt?.number||0)+1;
 const receipt={receipt:number,gate:184,addressField:'8x8',mapping:'A[i,j] -> B[j,i]',mobiusViewTurns:tx.visibleB.viewTurns,spinorSign:tx.visibleB.spinorSign,payloadBytes:bytes.length,originalSha256:await sha(bytes),restoredSha256:result.restored?await sha(result.restored):null,accepted,reason:result.error||(!accepted?'BYTE_MISMATCH':null),twistSignIsPhysicalMeasurement:false};
 lastReceipt=receipt;$('receipt').textContent=JSON.stringify(receipt,null,2);
}
function refreshAngle(){let turns=state().turns;
 $('angleRead').textContent=`${angle.toFixed(0)}°`;
 $('twistRead').textContent=turns%2?'REVERSED':'ORIGINAL';
 const rad=angle*Math.PI/360;
 $('phaseRead').textContent=`${Math.cos(rad).toFixed(3)} ${Math.sin(rad)>=0?'+':'−'} ${Math.abs(Math.sin(rad)).toFixed(3)}i`;
 $('byteRead').textContent=`${enc.encode($('cargo').value).length} bytes`;
}
let prevTurn=-1;
function refresh(){refreshAngle();if(tx&&state().turns!==prevTurn){rebuildVisible();verify();}prevTurn=state().turns;renderMatrices();drawAll();}
$('angle').addEventListener('input',()=>{angle=+$('angle').value;playing=false;$('play').textContent='Cruise';refresh()});
$('at360').addEventListener('click',()=>{angle=360;$('angle').value=angle;playing=false;refresh()});
$('at720').addEventListener('click',()=>{angle=720;$('angle').value=angle;playing=false;refresh()});
$('play').addEventListener('click',()=>{playing=!playing;$('play').textContent=playing?'Cruising…':'Cruise'});
$('hold').addEventListener('click',()=>{playing=false;$('play').textContent='Cruise'});
$('swap').addEventListener('click',async()=>{const packedA=packA($('cargo').value,GATE);tx={packedA,packedB:swapAtX(packedA,GATE)};fault=false;rebuildVisible();await verify();refresh();});
$('fault').addEventListener('click',async()=>{if(!tx){$('swap').click();return;}fault=!fault;rebuildVisible();await verify();renderMatrices();});
$('reset').addEventListener('click',()=>{tx=null;fault=false;lastReceipt=null;angle=0;$('angle').value='0';playing=false;$('play').textContent='Cruise';$('receipt').textContent='Node 184 idle. No inferred or simulated transmission has yet been accepted.';refresh();$('status').textContent='READY';$('status').className='status';$('verdict').textContent='NOT RUN';});
$('cargo').addEventListener('input',()=>{refreshAngle();if(tx)verify()});
function pt(theta,u){let R=1.02;return [(R+u*Math.cos(theta/2))*Math.cos(theta),(R+u*Math.cos(theta/2))*Math.sin(theta),u*Math.sin(theta/2)];}
function rotate(p,yaw,pitch){let [x,y,z]=p;let x1=x*Math.cos(yaw)+z*Math.sin(yaw),z1=-x*Math.sin(yaw)+z*Math.cos(yaw);return [x1,y*Math.cos(pitch)-z1*Math.sin(pitch),y*Math.sin(pitch)+z1*Math.cos(pitch)];}
function project(p,w,h,yaw,pitch){const [x,y,z]=rotate(p,yaw,pitch);const scale=Math.min(w/3.25,h/3.1)*(3/(3.5-z*.35));return {x:w/2+x*scale,y:h/2+y*scale,z,scale};}
function drawMobius(id,isB,clock){
 const canvas=$(id),dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 let yaw=(isB?2.5:-.6)+angle*Math.PI/180*.22+clock*.00011*(isB?-1:1),pitch=.66+Math.sin(clock*.00027)*.06;
 const cells=[],NU=10,NT=80;
 for(let i=0;i<NT;i++)for(let j=0;j<NU;j++){
  let t=i/NT*2*Math.PI,tn=(i+1)/NT*2*Math.PI,u=-.32+j*.64/NU,un=-.32+(j+1)*.64/NU;
  let v=[pt(t,u),pt(tn,u),pt(tn,un),pt(t,un)].map(p=>project(p,w,h,yaw,pitch));
  cells.push({v,z:v.reduce((a,p)=>a+p.z,0)/4,i,j});
 }
 cells.sort((a,b)=>a.z-b.z);
 for(const q of cells){let c=q.v;ctx.beginPath();ctx.moveTo(c[0].x,c[0].y);c.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();const lite=Math.round(27+23*(q.z+1.3)/3+9*Math.sin(q.i/NT*Math.PI*2));ctx.fillStyle=isB?`hsla(178,80%,${lite}%,0.79)`:`hsla(34,91%,${lite}%,0.79)`;ctx.fill();ctx.strokeStyle=isB?'#60bdc722':'#fec28e1e';ctx.lineWidth=.5;ctx.stroke();}
 const points=[];
 for(let i=0;i<8;i++)for(let j=0;j<8;j++){
  const theta=(i+.5)/8*Math.PI*2, u=-.315+j*(.63/7);const p=project(pt(theta,u),w,h,yaw,pitch),hit=isB?(i===selected[1]&&j===(state().turns%2?7-selected[0]:selected[0])):(i===selected[0]&&j===selected[1]);points.push({...p,hit,i,j});
 }
 points.sort((a,b)=>a.z-b.z);for(const p of points){ctx.beginPath();ctx.arc(p.x,p.y,p.hit?5.4:2.0,0,Math.PI*2);ctx.fillStyle=p.hit?'#ffffff':(isB?'#84eee8':'#ffd19a');ctx.globalAlpha=p.hit?1:.82;ctx.fill();ctx.globalAlpha=1;if(p.hit){ctx.strokeStyle=isB?'#4de1e7':'#ffa549';ctx.lineWidth=2;ctx.stroke();}}
 ctx.fillStyle=isB?'#7cdbd4':'#e9ae69';ctx.font='11px monospace';ctx.fillText('MÖBIUS  •  8 × 8',14,h-18);
}
function drawAll(now=0){drawMobius('left',false,now);drawMobius('right',true,now)}
function loop(now){if(!last)last=now;const dt=Math.min(now-last,100);last=now;
 if(playing){angle=(angle+dt*.028)%720;$('angle').value=Math.round(angle);refreshAngle();const t=state().turns;if(tx&&t!==prevTurn){rebuildVisible();verify();}if(t!==prevTurn){prevTurn=t;renderMatrices();}}
 drawAll(now);requestAnimationFrame(loop);
}
refresh();requestAnimationFrame(loop);window.__nullrider={get angle(){return angle},get tx(){return tx},get fault(){return fault},get receipt(){return lastReceipt}};
