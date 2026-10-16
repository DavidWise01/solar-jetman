'use strict';
const el=id=>document.getElementById(id);
let trial=null, result=null, revealed=false,selected=184,lastBench=null,phase=0;
const bands={TACH:'#f4b163',GYRO:'#5de0d1',POSI:'#a8a3ff',RESERVE:'#e8cf83'};
const fmt=n=>n===null||n===undefined?'—':Number(n).toFixed(2);
const percent=n=>n===null||n===undefined?'—':(n*100).toFixed(1)+'%';
const write=(id,v)=>{el(id).textContent=String(v);};
const addLog=(message,tone='neutral')=>{
  const line=document.createElement('div');line.className='logline '+tone;
  line.textContent='['+new Date().toLocaleTimeString()+']  '+message;
  el('log').prepend(line);while(el('log').children.length>9)el('log').lastElementChild.remove();
};
function initialize(){
  const seed=Number(el('seed').value), missing=Number(el('missing').value)/100;
  try{trial=LAB.syntheticTrial(seed,missing);result=null;revealed=false;lastBench=null;selected=184;el('bench').hidden=true;
    write('crossing','NO INFERENCE');write('cover','—');write('alerts','—');write('brier','—');write('truth','SEALED');write('engineState','OBSERVING');
    addLog(`NODE 184 → new synthetic world #${seed}; ${Math.round(missing*100)}% sensor dropout`);
    drawCells();readSelected();drawStats();
  }catch(e){addLog('REJECT: '+e.message,'bad');}
}
function runInference(){
  if(!trial)return;
  const before=trial.core.through184({via:184,op:'VIEW'}).snapshot;
  result=INF.infer184({via:184,op:'INFER',observations:trial.observations,high:0.80,low:0.08});
  const after=trial.core.through184({via:184,op:'VIEW'}).snapshot;
  if(!result.accepted){addLog('REJECT: '+result.error,'bad');return;}
  const preserved=before.fingerprint===after.fingerprint&&before.logSize===after.logSize&&before.cycle===after.cycle;
  write('crossing',preserved?'READ-ONLY PASS':'MUTATION DETECTED');
  write('engineState',preserved?'SCALAR 0 PRESERVED':'STOP');
  write('cover',percent((result.counts.ALERT+result.counts.CLEAR)/result.count));
  write('alerts',result.counts.ALERT);
  write('brier','HIDDEN');
  addLog(`INFER via 184 :: ${result.counts.ALERT} alerts · ${result.counts.CLEAR} clears · ${result.counts.ABSTAIN} abstentions; preserved ${preserved?'YES':'NO'}`,preserved?'good':'bad');
  drawCells();readSelected();drawStats();
}
function reveal(){
  if(!result){addLog('Run INFER before revealing truth','bad');return;}
  revealed=true;const s=LAB.score184(result,trial.truth);
  write('truth','REVEALED');write('brier',fmt(s.brier));
  addLog(`Test labels revealed: ${s.truthFaults} synthetic faults; alert precision ${percent(s.alertPrecision)}, recall ${percent(s.alertRecall)}`,'warn');
  drawCells();readSelected();drawStats();
}
function benchmark(){
  const t0=performance.now();const miss=Number(el('missing').value)/100;
  lastBench=LAB.syntheticBenchmark(20801,40,miss);
  const ms=Math.round(performance.now()-t0);
  write('benchlabel',`40 UNSEEN-SEED WORLDS · ${lastBench.totalCells.toLocaleString()} CELLS · ${ms}ms`);
  write('benchcoverage',percent(lastBench.coverage));write('benchprecision',percent(lastBench.alertPrecision));
  write('benchrecall',percent(lastBench.alertRecall));write('benchbrier',fmt(lastBench.brier));
  write('benchprior',fmt(lastBench.priorBrier));
  el('bench').hidden=false;
  addLog(`HOLDOUT → brier ${fmt(lastBench.brier)} vs age-only ${fmt(lastBench.priorBrier)}, recall ${percent(lastBench.alertRecall)}`,'good');
}
function readSelected(){
  if(!trial)return;
  const o=trial.observations[selected-1];const r=result?.rows.find(x=>x.id===selected);
  write('cellid',String(selected).padStart(3,'0'));
  write('cellband',o.band);write('cellsign',o.band==='TACH'?'−2':o.band==='GYRO'?'0':o.band==='POSI'?'+3':'RESERVE');
  write('cellage',o.age);
  write('cellalar',o.alarm===null?'MISSING':o.alarm?'ALARM':'QUIET');
  write('celldrift',o.drift===null?'MISSING':o.drift?'DRIFT':'NORMAL');
  write('cellposterior',r?.posterior===null?'UNKNOWN':r?percent(r.posterior):'NOT RUN');
  write('celldecision',r?.decision??'WAITING');
  write('celltruth',revealed?(trial.truth.get(selected)?'FAULT':'HEALTHY'):'HIDDEN');
}
function drawCells(){
  if(!trial)return;
  const elGrid=el('cellgrid');elGrid.replaceChildren();
  for(const o of trial.observations){
    const r=result?.rows[o.id-1];
    const b=document.createElement('button');b.type='button';b.className='cell';
    if(r)b.classList.add(r.decision.toLowerCase());
    if(revealed&&trial.truth.get(o.id))b.classList.add('truefault');
    if(o.id===selected)b.classList.add('selected');
    b.style.setProperty('--band',bands[o.band]);b.title=`${o.band} cell ${o.id}`;
    b.setAttribute('aria-label',`Inspect ${o.band} cell ${o.id}`);
    b.onclick=()=>{selected=o.id;readSelected();drawCells();};
    elGrid.appendChild(b);
  }
}
function drawStats(){
  const counts=trial.observations.reduce((a,o)=>(a[o.band]=(a[o.band]??0)+1,a),{});
  write('population',Object.values(counts).reduce((a,b)=>a+b,0)+'/365');
  write('sensor',`${trial.observations.filter(o=>o.alarm!==null||o.drift!==null).length}/365`);
}
function drawOrbit(t){
  const c=el('scene'),cx=c.getContext('2d');if(!cx)return;
  const rect=c.getBoundingClientRect(),w=Math.round(rect.width),h=Math.round(rect.height),dpr=Math.min(2,devicePixelRatio||1);
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,w,h);
  const centerX=w/2,centerY=h/2,rr=Math.min(w*.26,h*.40);
  const values=[{name:'TACH',r:rr*1.45,color:bands.TACH,dr:1},{name:'GYRO',r:rr*1.10,color:bands.GYRO,dr:-.65},{name:'POSI',r:rr*.75,color:bands.POSI,dr:1.25}];
  for(const ring of values){
    cx.save();cx.translate(centerX,centerY);cx.rotate(phase*ring.dr);
    cx.strokeStyle=ring.color;cx.globalAlpha=.55;cx.lineWidth=1.5;cx.beginPath();cx.ellipse(0,0,ring.r,ring.r*.40,0,0,Math.PI*2);cx.stroke();
    for(let i=0;i<19;i++){const a=i/19*Math.PI*2;cx.fillStyle=ring.color;cx.globalAlpha=.30+i/19*.55;
      cx.beginPath();cx.arc(ring.r*Math.cos(a),ring.r*.4*Math.sin(a),i%5===0?3.3:1.4,0,Math.PI*2);cx.fill();}
    cx.restore();
  }
  cx.strokeStyle='#e7e7e7';cx.globalAlpha=.4;cx.beginPath();cx.moveTo(centerX-rr*1.55,centerY);cx.lineTo(centerX+rr*1.55,centerY);cx.stroke();
  cx.globalAlpha=1;cx.beginPath();cx.arc(centerX,centerY,22,0,Math.PI*2);cx.fillStyle='#0c211c';cx.fill();cx.strokeStyle='#b7f4d6';cx.lineWidth=1.2;cx.stroke();
  cx.textAlign='center';cx.fillStyle='#e0ffee';cx.font='700 12px monospace';cx.fillText('184',centerX,centerY+4);
  cx.fillStyle='#768e91';cx.font='11px monospace';cx.fillText('SCALAR 0',centerX,centerY+43);
  if(!el('pause').checked)phase+=.003;
  requestAnimationFrame(drawOrbit);
}
el('seed').addEventListener('change',initialize);el('missing').addEventListener('input',()=>write('missingLabel',el('missing').value+'%'));
el('new').addEventListener('click',initialize);el('infer').addEventListener('click',runInference);el('reveal').addEventListener('click',reveal);
el('runbench').addEventListener('click',benchmark);
el('export').addEventListener('click',()=>{if(!lastBench){addLog('Run the benchmark before exporting','bad');return;}const text=JSON.stringify({schema:'nullrider.184.infer.v1',benchmark:lastBench,source:'SYNTHETIC HOLDOUT',timestamp:new Date().toISOString()},null,2);const file=new Blob([text],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='node184-inference-synthetic-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
initialize();requestAnimationFrame(drawOrbit);
