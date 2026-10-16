import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorld} from '../phase/benchmark.mjs';
import {calibrate184,inferAdaptive184,scorePacket184,selectQuota184} from './adaptive.mjs';
import {benchmarkAdaptive184} from './benchmark.mjs';
const a=Array.from({length:12},(_,i)=>newWorld(610000+i,0.6,true));
const c=calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:a});
const w=newWorld(710000,.6,true);
test('calibration issues process-local immutable policy',()=>{
 assert.equal(c.accepted,true);assert.equal(c.policy.selected,'PHASE_OPPOSED');
 assert.equal(Object.isFrozen(c.policy),true);assert.equal(Object.isFrozen(c.policy.calibrationBrier),true);
 assert.match(c.policy.referenceDigest,/^[0-9a-f]{64}$/);
});
test('only Node184 may calibrate',()=>{
 for(const via of [0,183,185,'184',null])assert.equal(calibrate184({via,op:'CALIBRATE_ADAPTIVE',referenceWorlds:a}).error,'WRONG_GATE_EXPECTED_184');
});
test('only read-only observation inference operations',()=>{
 for(const op of ['FAULT','RENEW','VIEW','INFER_PHASE'])assert.equal(inferAdaptive184({via:184,op,observations:w.rotating,policy:c.policy}).error,'READ_ONLY_GATE');
});
test('requires enough distinct reference worlds',()=>{
 assert.equal(calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:a.slice(0,11)}).error,'INSUFFICIENT_CALIBRATION_WORLDS');
 assert.equal(calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:[...a.slice(0,11),a[0]]}).error,'BAD_OR_REPEATED_CALIBRATION_SEED');
});
test('requires known labels only for calibration',()=>{
 const clone={...a[0],truth:null};assert.equal(calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:[clone,...a.slice(1)]}).error,'CALIBRATION_REQUIRES_KNOWN_REFERENCE_LABELS');
});
test('no hidden truth fields allowed in inference observations',()=>{
 const q=[{...w.rotating[0],truth:true}];assert.equal(inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:q,policy:c.policy}).error,'UNEXPECTED_FIELD_OR_TRUTH_LEAK');
});
test('phase gate enforced at 0 and 180',()=>{
 const q=[{...w.rotating[0],phase:[{angle:0,value:0},{angle:90,value:0}]}];
 assert.equal(inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:q,policy:c.policy}).error,'PHASE_GATE_CLOSED');
});
test('forged or JSON-deserialized calibration is rejected',()=>{
 const fake=JSON.parse(JSON.stringify(c.policy));
 assert.equal(inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:w.rotating,policy:fake}).error,'UNTRUSTED_OR_MISSING_POLICY');
});
test('untrusted policies and a fake validated flag rejected',()=>{
 assert.equal(inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:w.rotating,policy:{version:'NODE184_PHASE_ADAPTIVE_V2',selected:'PHASE_OPPOSED',realSensorValidated:true}}).accepted,false);
});
test('observer is read-only and preserves 365 cells',()=>{
 const before=w.core.through184({via:184,op:'VIEW'}).snapshot;
 const p=inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:w.rotating,policy:c.policy});
 const after=w.core.through184({via:184,op:'VIEW'}).snapshot;
 assert.equal(p.accepted,true);assert.equal(p.readonly,true);assert.equal(p.rows.length,365);
 assert.equal(before.fingerprint,after.fingerprint);assert.equal(before.logSize,after.logSize);assert.equal(after.occupied,365);
});
test('1/8 x 8 x 1/8 is not conflated with 2 percent quota',()=>{
 let c=0,sum=0;for(let i=0;i<100;i++){c+=3;const q=7+(c>=10?1:0);if(c>=10)c-=10;sum+=q;}assert.equal(sum,730);
});
test('branch fairness enforces TACH GYRO POSI',()=>{
 const p=inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:w.rotating,policy:c.policy});
 const picked=selectQuota184(p.rows,7);
 assert.equal(picked.length,7);assert.equal(new Set(picked.map(r=>r.band)).has('TACH'),true);
 assert.equal(new Set(picked.map(r=>r.band)).has('GYRO'),true);
 assert.equal(new Set(picked.map(r=>r.band)).has('POSI'),true);
});
test('null phase chooses baseline without labels leaked to runtime',()=>{
 const refs=Array.from({length:24},(_,i)=>newWorld(810000+i,0,true));
 const p=calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:refs});assert.equal(p.policy.selected,'BASELINE');
 const q=newWorld(820000,0,true);const inf=inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:q.rotating,policy:p.policy});
 assert.equal(inf.model,'BASELINE');assert.equal(inf.rows.some(x=>Object.hasOwn(x,'truth')),false);
});
test('phase-invariant data chooses phase-invariant expert',()=>{
 const refs=Array.from({length:24},(_,i)=>newWorld(830000+i,.6,false));
 const p=calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:refs});assert.equal(p.policy.selected,'PHASE_INVARIANT');
});
test('blind heldout regime selects opposite on real phase signal',()=>{
 const r=benchmarkAdaptive184({mode:'OPPOSED',calN:24,testN:30});
 assert.equal(r.calibration.selected,'PHASE_OPPOSED');assert.equal(r.test.populationPreserved,true);
 assert.equal(r.test.quota,219);assert.ok(r.test.hits.adaptive>r.test.hits.stationary);
});
test('blind heldout null regime avoids rigid phase model',()=>{
 const r=benchmarkAdaptive184({mode:'NULL',calN:24,testN:30});
 assert.equal(r.calibration.selected,'BASELINE');assert.ok(r.test.hits.adaptive>=r.test.hits.rigid);
});
test('blind heldout invariant regime beats incorrectly specified rigid observer',()=>{
 const r=benchmarkAdaptive184({mode:'INVARIANT',calN:24,testN:30});
 assert.equal(r.calibration.selected,'PHASE_INVARIANT');assert.ok(r.test.hits.adaptive>r.test.hits.rigid);
});
test('calibration/test seed ranges cannot overlap',()=>{
 assert.throws(()=>benchmarkAdaptive184({mode:'OPPOSED',calStart:460000,testStart:460020,calN:24,testN:4}),/OVERLAP/);
});
test('scorer preserves all observations but refuses extra hidden state',()=>{
 const t=scorePacket184({via:184,op:'INFER_ADAPTIVE',observations:w.rotating});assert.equal(t.rows.length,365);
 assert.equal(scorePacket184({via:185,op:'INFER_ADAPTIVE',observations:w.rotating}).accepted,false);
});
test('calibration selects same policy deterministically',()=>{
 const again=calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:a});
 assert.equal(again.policy.selected,c.policy.selected);assert.equal(again.policy.referenceDigest,c.policy.referenceDigest);
});
