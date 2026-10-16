import fs from 'node:fs';
import {newWorld} from '../phase/benchmark.mjs';
import {inferPhase184} from '../phase/phase.mjs';
import {calibrate184,inferAdaptive184,selectQuota184} from './adaptive.mjs';
const MODES={OPPOSED:{amplitude:0.6,phaseEffect:true},NULL:{amplitude:0,phaseEffect:true},INVARIANT:{amplitude:0.6,phaseEffect:false}};
const CAL_START=310000,TEST_START=460000,CAL_N=24,TEST_N=100;
const mean=xs=>xs.reduce((s,x)=>s+x,0)/xs.length;
export function benchmarkAdaptive184({mode,calStart=CAL_START,testStart=TEST_START,calN=CAL_N,testN=TEST_N}={}){
 if(!(mode in MODES))throw Error('UNKNOWN_MODE');
 const conf=MODES[mode];
 if(calStart+calN>=testStart)throw Error('CALIBRATION_TEST_SEED_OVERLAP');
 const before=[];
 const references=Array.from({length:calN},(_,i)=>newWorld(calStart+i,conf.amplitude,conf.phaseEffect));
 const gate=calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:references});
 if(!gate.accepted)throw Error(JSON.stringify(gate));
 let quotaCarry=0;
 const results=[];
 for(let i=0;i<testN;i++){
  const w=newWorld(testStart+i,conf.amplitude,conf.phaseEffect);
  const pre=w.core.through184({via:184,op:'VIEW'}).snapshot;
  const adapt=inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:w.rotating,policy:gate.policy});
  const rigid=inferPhase184({via:184,op:'INFER_PHASE',mode:'COUNTER_ROTATING',observations:w.rotating});
  const steady=inferPhase184({via:184,op:'INFER_PHASE',mode:'STATIONARY',observations:w.stationary});
  if(!adapt.accepted||!rigid.accepted||!steady.accepted)throw Error('SCORER_REJECT');
  quotaCarry+=3;const quota=7+(quotaCarry>=10?1:0);if(quotaCarry>=10)quotaCarry-=10;
  const qAdapt=selectQuota184(adapt.rows,quota),qRigid=selectQuota184(rigid.rows,quota),qSteady=selectQuota184(steady.rows,quota);
  let brierA=0,brierR=0,brierS=0,brierBase=0;
  for(let j=0;j<365;j++){
   const y=+(!!w.truth.get(adapt.rows[j].id));
   brierA+=(adapt.rows[j].posterior-y)**2;
   brierR+=(rigid.rows[j].posterior-y)**2;
   brierS+=(steady.rows[j].posterior-y)**2;
   brierBase+=(rigid.rows[j].basePosterior-y)**2;
  }
  const after=w.core.through184({via:184,op:'VIEW'}).snapshot;
  const hits=q=>q.filter(r=>w.truth.get(r.id)).length;
  results.push({seed:w.seed,mode,policy:gate.policy.selected,quota,faults:w.faultCount,
    selectedAdaptive:hits(qAdapt),selectedRigid:hits(qRigid),selectedStationary:hits(qSteady),
    brierAdaptive:brierA/365,brierRigid:brierR/365,brierStationary:brierS/365,brierBase:brierBase/365,
    preserved:pre.fingerprint===after.fingerprint&&pre.logSize===after.logSize&&after.occupied===365});
 }
 const totals=k=>results.reduce((s,r)=>s+r[k],0);
 return {mode,calibration:{worlds:calN,seedRange:[calStart,calStart+calN-1],...gate.policy},
   test:{worlds:testN,seedRange:[testStart,testStart+testN-1],cells:testN*365,
     quota:totals('quota'),faults:totals('faults'),
     hits:{adaptive:totals('selectedAdaptive'),rigid:totals('selectedRigid'),stationary:totals('selectedStationary')},
     precision:{adaptive:totals('selectedAdaptive')/totals('quota'),rigid:totals('selectedRigid')/totals('quota'),stationary:totals('selectedStationary')/totals('quota')},
     brier:{adaptive:mean(results.map(r=>r.brierAdaptive)),rigid:mean(results.map(r=>r.brierRigid)),stationary:mean(results.map(r=>r.brierStationary)),base:mean(results.map(r=>r.brierBase))},
     populationPreserved:results.every(r=>r.preserved)},results};
}
export function runAll184(){return Object.fromEntries(Object.keys(MODES).map(mode=>[mode,benchmarkAdaptive184({mode})]));}
if(import.meta.url===new URL(`file://${process.argv[1]}`).href){
 const all=runAll184();
 fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(Object.fromEntries(Object.entries(all).map(([k,v])=>[k,{mode:v.mode,calibration:v.calibration,test:v.test}])),null,2)+'\n');
 const csv=['mode,seed,policy,quota,faults,adaptive_hits,rigid_hits,stationary_hits,adaptive_brier,rigid_brier,stationary_brier,base_brier,preserved'];
 for(const w of Object.values(all))for(const r of w.results)csv.push([r.mode,r.seed,r.policy,r.quota,r.faults,r.selectedAdaptive,r.selectedRigid,r.selectedStationary,r.brierAdaptive,r.brierRigid,r.brierStationary,r.brierBase,r.preserved].join(','));
 fs.writeFileSync(new URL('./heldout_worlds.csv',import.meta.url),csv.join('\n')+'\n');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(all).map(([k,v])=>[k,{policy:v.calibration.selected,calBrier:v.calibration.calibrationBrier,test:v.test}])),null,2));
}
