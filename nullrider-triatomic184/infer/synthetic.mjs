/* Reproducible synthetic sensor laboratory. Hidden truth is separated from INFER packet. */
import {createTriatomic184} from '../engine.mjs';
import {prior184, SENSOR_MODEL, infer184} from './infer.mjs';
export function random184(seed){let x=seed>>>0;if(!x)x=1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export function syntheticTrial(seed=184,missingFraction=.25){
  if(!Number.isInteger(seed)||seed<1||seed>2_000_000_000)throw Error('BAD_SEED');
  if(!Number.isFinite(missingFraction)||missingFraction<0||missingFraction>1)throw Error('BAD_MISSING_RATE');
  const rand=random184(seed),core=createTriatomic184();
  const original=core.through184({via:184,op:'VIEW'}).snapshot;
  const observations=[],truth=new Map();let faultCount=0;
  for(const c of original.cells){
    const fault=rand()<prior184(c.age,c.band);
    truth.set(c.id,fault);
    if(fault){faultCount++;const f=core.through184({via:184,op:'FAULT',cell:c.id,tx:`fixture-${seed}-fault-${c.id}`});if(!f.accepted)throw Error('FAULT_ROUTE_FAILED');}
    const alarm=rand()<(fault?SENSOR_MODEL.alarm.sensitivity:SENSOR_MODEL.alarm.falsePositiveRate);
    const drift=rand()<(fault?SENSOR_MODEL.drift.sensitivity:SENSOR_MODEL.drift.falsePositiveRate);
    observations.push({id:c.id,band:c.band,age:c.age,
      alarm:rand()<missingFraction?null:alarm,
      drift:rand()<missingFraction?null:drift});
  }
  const post=core.through184({via:184,op:'VIEW'}).snapshot;
  if(post.faults!==faultCount)throw Error('TRUTH_GATE_MISMATCH');
  return {seed,missingFraction,observations,truth,core,faultCount};
}
export function score184(result,truth){
  if(!result.accepted)throw Error('INFERENCE_REJECTED');
  let alert=0,alertCorrect=0,clear=0,clearCorrect=0,abstain=0,correct=0,brierSum=0,brierN=0,baselineSum=0,positive=0,alertsFound=0;
  const buckets=Array.from({length:10},()=>({n:0,p:0,y:0}));
  for(const r of result.rows){
    const y=truth.get(r.id)?1:0;positive+=y;
    if(r.posterior!==null){
      brierSum+=(r.posterior-y)**2;baselineSum+=(prior184(r.age,r.band)-y)**2;brierN++;
      const b=buckets[Math.min(9,Math.floor(r.posterior*10))];b.n++;b.p+=r.posterior;b.y+=y;
    }
    if(r.decision==='ALERT'){alert++;alertCorrect+=y;alertsFound+=y;correct+=y;}
    else if(r.decision==='CLEAR'){clear++;clearCorrect+=1-y;correct+=1-y;}
    else abstain++;
  }
  let ece=0;
  for(const b of buckets)if(b.n)ece+=b.n/result.count*Math.abs(b.p/b.n-b.y/b.n);
  return {count:result.count,truthFaults:positive,alerts:alert,clears:clear,abstains:abstain,
    coverage:(alert+clear)/result.count,decidedAccuracy:alert+clear?correct/(alert+clear):null,
    alertPrecision:alert?alertCorrect/alert:null,clearSpecificity:clear?clearCorrect/clear:null,
    alertRecall:positive?alertsFound/positive:null,brier:brierN?brierSum/brierN:null,priorBrier:brierN?baselineSum/brierN:null,
    eceObserved:ece,scored:brierN};
}
export function syntheticBenchmark(startSeed=20801,trials=40,missingFraction=.25,high=.8,low=.08){
  const rows=[];
  for(let i=0;i<trials;i++){
    const t=syntheticTrial(startSeed+i,missingFraction);
    const p=infer184({via:184,op:'INFER',observations:t.observations,high,low});
    rows.push({seed:t.seed,...score184(p,t.truth)});
  }
  const total=k=>rows.reduce((s,r)=>s+r[k],0);
  const weighted=(k,w)=>{const denom=total(w);return denom?rows.reduce((s,r)=>s+(r[k]??0)*r[w],0)/denom:null;};
  return {startSeed,trials,missingFraction,thresholds:{high,low},totalCells:total('count'),groundTruthFaults:total('truthFaults'),
    coverage:(total('alerts')+total('clears'))/total('count'),
    decidedAccuracy:weighted('decidedAccuracy','count')===null?null:rows.reduce((s,r)=>s+(r.decidedAccuracy??0)*(r.alerts+r.clears),0)/(total('alerts')+total('clears')),
    alertPrecision:total('alerts')?rows.reduce((s,r)=>s+(r.alertPrecision??0)*r.alerts,0)/total('alerts'):null,
    alertRecall:total('truthFaults')?rows.reduce((s,r)=>s+(r.alertRecall??0)*r.truthFaults,0)/total('truthFaults'):null,
    brier:weighted('brier','scored'),priorBrier:weighted('priorBrier','scored'),
    missingNoSignal:total('count')-total('scored'),rows};
}
