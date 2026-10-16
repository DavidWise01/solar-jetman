import {rendezvous,sha256} from './engine.mjs';
import {createScene} from './scene.mjs';
const $=id=>document.getElementById(id);
const payload=$('cargo'),status=$('statusChip');
const buttons=['launch','fault','pause','reset'];
let visual=null,run=null,lastRecord=null,paused=false,elapsed=0,raf=0,tPrev=0;
function say(phase,label){status.dataset.status=phase;status.textContent=label;visual?.setState(phase);}
const short=h=>h&&h!=='—'?`${h.slice(0,14)}…${h.slice(-7)}`:'—';
function setBusy(v){$('launch').disabled=v;$('fault').disabled=v;payload.disabled=v;}
function show(rec){
 $('sourceHash').textContent=short(rec.source_sha256);$('aHash').textContent=short(rec.solar_a_sha256);$('bHash').textContent=short(rec.solar_b_sha256);
 for(const id of ['sourceHash','aHash','bHash'])$(id).title=rec[id==='sourceHash'?'source_sha256':id==='aHash'?'solar_a_sha256':'solar_b_sha256'];
 $('crossCount').textContent=String(rec.seam_crossings);
 $('preservation').textContent=rec.preservation?'PRESERVED':'REJECTED';
 $('preservation').style.color=rec.preservation?'#9df2bf':'#ff897f';
 $('receiptState').textContent=rec.status;
 $('receiptState').style.color=rec.status==='ACCEPT'?'#9df2bf':'#ff897f';
 $('witnessFlag').textContent=rec.status==='ACCEPT'?'MATCH':'MISMATCH';
 const box=$('receipt');box.className='receipt '+(rec.status==='ACCEPT'?'ok':'fail');
 box.textContent=`${rec.status}  /  ${rec.tx_id}\nSOURCE  ${rec.source_sha256}\nSEAM    ${rec.seam_crossings}  ·  ${rec.preservation?'PRESERVED':'BLOCKED'}\n${rec.observed_at}`;
}
function tick(t){
 if(run && !paused){elapsed+=Math.min(60,t-(tPrev||t));const f=Math.min(1,elapsed/2700);visual?.setProgress(f);
 if(f>=.12 && f<.7 && status.dataset.status!=='CROSSING')say('CROSSING','↔  BRANCHES CONVERGING');
 if(f>=.7 && f<1 && status.dataset.status!=='VERIFYING')say('VERIFYING','◇  VERIFYING AT ZERO');
 if(f>=1){show(run.record);lastRecord=run.record;say(run.record.status,run.record.status==='ACCEPT'?'✓  PRESERVATION ACCEPTED':'✕  SEAM REJECTED');run=null;setBusy(false);}
 }
 $('clock').textContent=`T+ ${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor((elapsed%60000)/1000)).padStart(2,'0')}.${Math.floor(elapsed%1000/100)}`;
 tPrev=t;raf=requestAnimationFrame(tick);
}
async function launch(fault){
 if(run)return;setBusy(true);paused=false;$('pause').textContent='Ⅱ PAUSE';elapsed=0;lastRecord=null;
 say('CROSSING','↔  BRANCHES CONVERGING');
 try{run=await rendezvous(payload.value,{fault});}
 catch(error){run=null;setBusy(false);say('REJECT',`✕  ${error.message}`);$('receipt').textContent=error.stack?.split('\n')[0]||error.message;}
}
$('launch').addEventListener('click',()=>launch(false));
$('fault').addEventListener('click',()=>launch(true));
$('reset').addEventListener('click',()=>{
 run=null;lastRecord=null;paused=false;elapsed=0;setBusy(false);$('pause').textContent='Ⅱ PAUSE';
 for(const id of ['sourceHash','aHash','bHash']){$(id).textContent='—';$(id).title='';}
 $('crossCount').textContent='0';$('preservation').textContent='UNTESTED';$('preservation').style.color='';
 $('receiptState').textContent='STANDBY';$('receiptState').style.color='';$('witnessFlag').textContent='AWAITING';
 $('receipt').className='receipt';$('receipt').textContent='Reset complete. Ready for another rendezvous.';say('IDLE','●  WAITING AT ZERO');
});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'▶ RESUME':'Ⅱ PAUSE';visual?.setPaused(paused);});
$('copy').addEventListener('click',async()=>{
 if(!lastRecord){$('receipt').textContent='Launch a rendezvous to produce a receipt first.';return;}
 try{await navigator.clipboard.writeText(JSON.stringify(lastRecord,null,2));$('copy').textContent='COPIED ✓';setTimeout(()=>$('copy').textContent='COPY JSON',1400);}catch(e){$('copy').textContent='COPY FAILED';}
});
function updateCount(){const b=new TextEncoder().encode(payload.value);$('byteCount').textContent=`${b.length.toLocaleString()} BYTES`;}payload.addEventListener('input',updateCount);updateCount();
createScene($('stage'),label=>$('renderStatus').textContent=label).then(x=>visual=x).catch(e=>{$('renderStatus').textContent='RENDERER ERROR · '+e.message;});
raf=requestAnimationFrame(tick);
window.NULLRIDER_TEST={launch,show,getState:()=>({run:!!run,lastRecord,phase:status.dataset.status,elapsed}),reset:()=>$('reset').click()};
