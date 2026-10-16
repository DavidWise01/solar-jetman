import {rendezvous} from './engine.mjs';
import {createScene} from './scene.mjs';
import {selectTemporal,shellPair,laneSample,receiptOverlay,verifyOverlay,GRID} from './cruise.mjs';
const $=id=>document.getElementById(id);
const btn={launch:$('launch'),fault:$('fault'),pause:$('pause'),reset:$('reset')};
const state={time:0,shell:31,speed:1,head:0,paused:false,active:false,result:null,elapsed:0,visual:null,lastReceipt:null,lastNow:0,signal:0};
const say=(code,message)=>{const box=$('status');box.dataset.status=code;box.textContent=message;state.visual?.setState(code);};
const short=x=>x?x.slice(0,12)+'…'+x.slice(-7):'—';
function repaint(){
 const t=selectTemporal(state.time),s=shellPair(state.shell);
 for(const btn of document.querySelectorAll('[data-time]')){btn.classList.toggle('picked',Number(btn.dataset.time)===state.time);btn.setAttribute('aria-pressed',String(Number(btn.dataset.time)===state.time));}
 $('frameLabel').textContent=`${t.label} / ${t.temporal>0?'+':''}${t.temporal}`;
 $('engineLabel').textContent=`${t.engine} / ${t.value>0?'+':''}${t.value}`;
 $('shellIndex').textContent=String(state.shell);$('topExp').textContent=s.positive.replace('-', '−');$('bottomExp').textContent=s.negative.replace('-', '−');$('topAngle').textContent=s.aDegrees+'°';$('bottomAngle').textContent=s.bDegrees+'°';
 $('headValue').textContent=String(state.head);$('layerAddress').textContent=`H${String(state.head).padStart(2,'0')} / ${(GRID.rows*GRID.cols).toLocaleString()} cells`;
 $('speedValue').textContent=state.speed.toFixed(2)+'×';
 const bytes=new TextEncoder().encode($('cargo').value);$('byteCount').textContent=bytes.length.toLocaleString()+' BYTES';
 const counts=laneSample($('cargo').value,state.head);$('lanes').replaceChildren(...counts.map((n,i)=>{
  const wrap=document.createElement('div');wrap.className='miniBar';const h=document.createElement('i');h.style.height=(7+(n%65))+'px';const label=document.createElement('span');label.textContent=String(i+1);wrap.append(h,label);return wrap;
 }));
}
function show(rec){
 $('srcHash').textContent=short(rec.source_sha256);$('aHash').textContent=short(rec.solar_a_sha256);$('bHash').textContent=short(rec.solar_b_sha256);
 for(const [id,key] of [['srcHash','source_sha256'],['aHash','solar_a_sha256'],['bHash','solar_b_sha256']])$(id).title=rec[key];
 $('crossings').textContent=String(rec.seam_crossings);$('preservation').textContent=rec.preservation?'PRESERVED':'BLOCKED';
 $('verdict').textContent=rec.status;const box=$('receipt');box.className='receipt '+(rec.status==='ACCEPT'?'ok':'bad');
 box.textContent=[`${rec.status} · ${rec.tx_id}`,`SHA-256: ${rec.source_sha256}`,`A == B: ${rec.preservation}`,`Crossings: ${rec.seam_crossings}`,`Time: ${rec.cruise.time_state} ${rec.cruise.temporal}`,`Engine: ${rec.cruise.engine} ${rec.cruise.engine_coordinate}`,`Shell: ±${rec.cruise.shell_index} / ${rec.cruise.shell_a_degrees}° ↔ ${rec.cruise.shell_b_degrees}°`].join('\n');
}
function setBusy(v){state.active=v;btn.launch.disabled=v;btn.fault.disabled=v;$('cargo').disabled=v;}
async function cross(fault){
 if(state.active)return;setBusy(true);state.elapsed=0;state.lastReceipt=null;
 const overlay=receiptOverlay({temporal:state.time,shell:state.shell,head:state.head,speed:state.speed});
 const payload=$('cargo').value;
 say('CROSSING','↔ BRANCHES APPROACH ZERO');
 try{
   const data=await rendezvous(payload,{fault});if(!verifyOverlay(overlay))throw Error('INVALID_CRUISE_CONTEXT');
   const record={...data.record,cruise:overlay,cruise_preservation:verifyOverlay(overlay)};
   state.result=record;return record;
 }catch(e){state.result=null;setBusy(false);say('REJECT','✕ '+e.message);$('receipt').textContent=String(e.message);}
}
function tick(now){
 const dt=Math.min(70,Math.max(0,now-(state.lastNow||now)));state.lastNow=now;
 if(!state.paused&&state.active&&state.result){state.elapsed+=dt*state.speed;const p=Math.min(1,state.elapsed/2700);state.visual?.setProgress(p);
  if(p>.67&&p<1&&$('status').dataset.status!=='VERIFYING')say('VERIFYING','◇ PRESERVATION AT ZERO');
  if(p===1){const rec=state.result;show(rec);state.lastReceipt=rec;state.result=null;setBusy(false);say(rec.status,rec.status==='ACCEPT'?'✓ PRESERVED / CONTINUE CRUISING':'✕ REJECTED / CONTINUE CRUISING');}
 }
 // Animated directional scrub ring remains non-authoritative / continuous.
 if(!state.paused){state.signal=(state.signal+dt*state.speed*.012)%360;document.documentElement.style.setProperty('--cruise-phase',`${state.signal}deg`);}
 requestAnimationFrame(tick);
}
document.querySelectorAll('[data-time]').forEach(btn=>btn.addEventListener('click',()=>{state.time=Number(btn.dataset.time);repaint();}));
$('shell').addEventListener('input',e=>{state.shell=Number(e.target.value);repaint();});
$('head').addEventListener('input',e=>{state.head=Number(e.target.value);repaint();});
$('speed').addEventListener('input',e=>{state.speed=Number(e.target.value);state.visual?.setCruiseSpeed(state.speed);repaint();});
$('cargo').addEventListener('input',repaint);
btn.launch.addEventListener('click',()=>cross(false));btn.fault.addEventListener('click',()=>cross(true));
btn.pause.addEventListener('click',()=>{state.paused=!state.paused;btn.pause.textContent=state.paused?'▶ RESUME':'Ⅱ PAUSE';state.visual?.setPaused(state.paused);});
btn.reset.addEventListener('click',()=>{state.result=null;state.lastReceipt=null;state.elapsed=0;state.time=0;state.shell=31;state.head=0;state.speed=1;state.paused=false;state.visual?.setPaused(false);state.visual?.setCruiseSpeed(1);btn.pause.textContent='Ⅱ PAUSE';$('shell').value='31';$('head').value='0';$('speed').value='1';setBusy(false);for(const id of ['srcHash','aHash','bHash'])$(id).textContent='—';$('crossings').textContent='0';$('preservation').textContent='UNTESTED';$('verdict').textContent='AWAITING';$('receipt').className='receipt';$('receipt').textContent='Reset complete. Free cruising.';repaint();say('IDLE','● FREE CRUISE');});
$('copy').addEventListener('click',async()=>{if(!state.lastReceipt){$('receipt').textContent='No receipt yet. Press MEET AT ZERO.';return;}try{await navigator.clipboard.writeText(JSON.stringify(state.lastReceipt,null,2));$('copy').textContent='COPIED ✓';setTimeout(()=>$('copy').textContent='COPY JSON RECEIPT',1400);}catch{$('copy').textContent='CLIPBOARD UNAVAILABLE';}});
repaint();createScene($('stage'),label=>$('renderer').textContent=label).then(scene=>{state.visual=scene;scene.setCruiseSpeed(state.speed);}).catch(e=>$('renderer').textContent=`SCENE ERROR: ${e.message}`);
requestAnimationFrame(tick);
window.NULLRIDER_CRUISE_TEST={getState:()=>({time:state.time,shell:state.shell,speed:state.speed,head:state.head,active:state.active,lastReceipt:state.lastReceipt,phase:$('status').dataset.status}),cross,reset:()=>btn.reset.click(),pause:()=>btn.pause.click()};
