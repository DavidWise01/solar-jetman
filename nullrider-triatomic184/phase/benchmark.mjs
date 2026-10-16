import fs from 'node:fs';
import {syntheticTrial,random184} from '../infer/synthetic.mjs';
import {inferPhase184,phaseState184} from './phase.mjs';
import {performance} from 'node:perf_hooks';
const ROOT=new URL('./',import.meta.url);
const normal=rng=>Math.sqrt(-2*Math.log(Math.max(1e-12,rng())))*Math.cos(2*Math.PI*rng());
const CONFIG=Object.freeze({worlds:100,startSeed:271840,missingFraction:.25,amplitude:.6,sigmaBackground:1.1,sigmaNoise:.6,quotaCycles:10});
const BANDS=['TACH','GYRO','POSI'];
export function newWorld(seed,amp=CONFIG.amplitude,phaseEffect=true){
  const t=syntheticTrial(seed,CONFIG.missingFraction),rng=random184(seed^0x5a184c3);
  const stationary=[],rotating=[];
  for(const o of t.observations){
    // Hidden ground truth is used only by the fixture's sensor simulator.
    // INFER_PHASE packets contain no ground-truth fields.
    const y=t.truth.get(o.id)?1:0,common=normal(rng)*CONFIG.sigmaBackground,
      noise0=normal(rng)*CONFIG.sigmaNoise,noise1=normal(rng)*CONFIG.sigmaNoise;
    const x0=common+amp*y+noise0;
    const xStation=common+amp*y+noise1;
    const xRotate=common+(phaseEffect?-amp:amp)*y+noise1;
    stationary.push({...o,phase:[{angle:0,value:x0},{angle:0,value:xStation}]});
    rotating.push({...o,phase:[{angle:0,value:x0},{angle:180,value:xRotate}]});
  }
  return {...t,stationary,rotating};
}
function selectTop(rows,k){
  // Same quota and minimum one slot per primary branch for both policies.
  const sorted=(list)=>[...list].sort((a,b)=>b.posterior-a.posterior||a.id-b.id);
  const picked=[];const seen=new Set();
  for(const band of BANDS){const row=sorted(rows.filter(x=>x.band===band))[0];picked.push(row);seen.add(row.id);}
  const remaining=sorted(rows.filter(x=>!seen.has(x.id)));
  picked.push(...remaining.slice(0,k-picked.length));
  return picked;
}
export function evaluateWorld(world,amp=CONFIG.amplitude,quota=7){
  const common={via:184,op:'INFER_PHASE',amplitude:amp,sigmaBackground:CONFIG.sigmaBackground,sigmaNoise:CONFIG.sigmaNoise};
  const s=inferPhase184({...common,mode:'STATIONARY',observations:world.stationary});
  const r=inferPhase184({...common,mode:'COUNTER_ROTATING',observations:world.rotating});
  if(!s.accepted||!r.accepted)throw Error('INFER_REJECTED '+JSON.stringify({s:s.error,r:r.error}));
  let bS=0,bR=0,bBase=0, positives=0;
  for(let i=0;i<365;i++){
    const y=world.truth.get(s.rows[i].id)?1:0;positives+=y;
    bS+=(s.rows[i].posterior-y)**2;bR+=(r.rows[i].posterior-y)**2;
    bBase+=(s.rows[i].basePosterior-y)**2;
  }
  const top8=8;
  const a=selectTop(s.rows,top8),b=selectTop(r.rows,top8);
  const quotaS=selectTop(s.rows,quota),quotaR=selectTop(r.rows,quota);
  return {seed:world.seed,faults:positives,brierStationary:bS/365,brierRotating:bR/365,brierBase:bBase/365,
    hitsStationary:a.filter(x=>world.truth.get(x.id)).length,hitsRotating:b.filter(x=>world.truth.get(x.id)).length,quota,
    quotaHitsStationary:quotaS.filter(x=>world.truth.get(x.id)).length,
    quotaHitsRotating:quotaR.filter(x=>world.truth.get(x.id)).length,
    overlap:a.filter(x=>b.some(z=>z.id===x.id)).length,
    population:world.core.through184({via:184,op:'VIEW'}).snapshot.occupied,
    fingerprint:world.core.through184({via:184,op:'VIEW'}).snapshot.fingerprint};
}
function mean(a,k){return a.reduce((s,x)=>s+x[k],0)/a.length;}
function standardErrorDiff(a,k1,k2){const d=a.map(x=>x[k1]-x[k2]),avg=d.reduce((s,x)=>s+x,0)/d.length;
  return Math.sqrt(d.reduce((s,x)=>s+(x-avg)**2,0)/(d.length-1)/d.length);}
function aggregate(worlds){
  const totalPos=worlds.reduce((s,x)=>s+x.faults,0);
  const hitS=worlds.reduce((s,x)=>s+x.hitsStationary,0),hitR=worlds.reduce((s,x)=>s+x.hitsRotating,0);
  const quotaTotal=worlds.reduce((s,x)=>s+x.quota,0);
  const qs=worlds.reduce((s,x)=>s+x.quotaHitsStationary,0),qr=worlds.reduce((s,x)=>s+x.quotaHitsRotating,0);
  const d=mean(worlds,'brierStationary')-mean(worlds,'brierRotating');
  const dh=(hitR-hitS)/worlds.length;
  const hitSE=standardErrorDiff(worlds,'hitsRotating','hitsStationary');
  return {worlds:worlds.length,cells:worlds.length*365,truthFaults:totalPos,
    brier:{base:mean(worlds,'brierBase'),stationary:mean(worlds,'brierStationary'),rotating:mean(worlds,'brierRotating'),absoluteImprovement:d,
      CI95:[d-1.96*standardErrorDiff(worlds,'brierStationary','brierRotating'),d+1.96*standardErrorDiff(worlds,'brierStationary','brierRotating')]},
    equalBudgetTop8:{slots:8*worlds.length,stationaryHits:hitS,rotatingHits:hitR,
      precisionStationary:hitS/(8*worlds.length),precisionRotating:hitR/(8*worlds.length),
      recallStationary:hitS/totalPos,recallRotating:hitR/totalPos,
      extraHitsPerWorld:dh,extraHitsCI95:[dh-1.96*hitSE,dh+1.96*hitSE]},
    exactTwoPercentBudget:{totalSlots:quotaTotal,stationaryHits:qs,rotatingHits:qr,
      stationaryPrecision:qs/quotaTotal,rotatingPrecision:qr/quotaTotal,
      stationaryRecall:qs/totalPos,rotatingRecall:qr/totalPos,
      improvementInHits:qr-qs},
    populationPreserved:worlds.every(w=>w.population===365)};
}
export function runBench(){
  const start=performance.now(),worlds=[];
  // Node 184 exact carry: quotas [7,7,7,8,7,7,8,7,7,8] per ten cycles.
  let carry=0;const quotas=[];for(let i=0;i<CONFIG.worlds;i++){carry+=3;const q=7+(carry>=10?1:0);if(carry>=10)carry-=10;quotas.push(q);}
  for(let i=0;i<CONFIG.worlds;i++)worlds.push(evaluateWorld(newWorld(CONFIG.startSeed+i),CONFIG.amplitude,quotas[i]));
  const main=aggregate(worlds);
  // Null control: angle-dependent term identically zero, so labels contain no phase information.
  const nulls=[];
  for(let i=0;i<CONFIG.worlds;i++)nulls.push(evaluateWorld(newWorld(CONFIG.startSeed+i,0,true),0,quotas[i]));
  const nullControl=aggregate(nulls);
  // Assumption violation control: second sensor retains SAME fault sign at 180°, contrary to phase model.
  const wrong=[];
  for(let i=0;i<CONFIG.worlds;i++)wrong.push(evaluateWorld(newWorld(CONFIG.startSeed+i,CONFIG.amplitude,false),CONFIG.amplitude,quotas[i]));
  const violated=aggregate(wrong);
  return {config:CONFIG,quotasFirst10:quotas.slice(0,10),gates:{at0:phaseState184(0),at180:phaseState184(180),at90:phaseState184(90)},
    main,nullControl,assumptionViolation:violated,runtimeMs:performance.now()-start,worlds};
}
if(process.argv[1] && import.meta.url===new URL(`file://${process.argv[1]}`).href){
  const report=runBench();
  fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify({...report,worlds:undefined},null,2)+'\n');
  const lines=['seed,faults,brier_stationary,brier_rotating,brier_base,top8_stationary_hits,top8_rotating_hits,quota,quota_stationary_hits,quota_rotating_hits,top8_overlap,population'];
  for(const w of report.worlds)lines.push([w.seed,w.faults,w.brierStationary,w.brierRotating,w.brierBase,w.hitsStationary,w.hitsRotating,w.quota,w.quotaHitsStationary,w.quotaHitsRotating,w.overlap,w.population].join(','));
  fs.writeFileSync(new URL('./worlds.csv',import.meta.url),lines.join('\n')+'\n');
  console.log(JSON.stringify({main:report.main,nullControl:report.nullControl,assumptionViolation:report.assumptionViolation,runtimeMs:report.runtimeMs},null,2));
}
