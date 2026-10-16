import test from 'node:test';
import assert from 'node:assert/strict';
import {infer184,prior184} from './infer.mjs';
import {syntheticTrial,syntheticBenchmark,score184} from './synthetic.mjs';
import {createTriatomic184} from '../engine.mjs';
const o=(id,alarm,drift,age=12,band='GYRO')=>({id,band,age,alarm,drift});
test('read-only observer accepts only Node 184 and INFER',()=>{
  for (const via of [0,183,185,'184',undefined]) assert.equal(infer184({via,op:'INFER',observations:[o(1,true,true)]}).accepted,false);
  for (const op of ['VIEW','RENEW','FAULT','RESEED','WRONG']) assert.equal(infer184({via:184,op,observations:[o(1,true,true)]}).error,'INFERENCE_READ_ONLY');
});
test('rejects all label-leak fields, duplicates and malformed inputs',()=>{
  for(const leakage of [{fault:true},{health:0},{target:1},{truth:false},{score:1}]) assert.equal(infer184({via:184,op:'INFER',observations:[{...o(1,true,true),...leakage}]}).error,'UNEXPECTED_FIELD_OR_LABEL_LEAK');
  assert.equal(infer184({via:184,op:'INFER',observations:[o(1,true,true),o(1,false,false)]}).error,'DUPLICATE_CELL_ID');
  for(const bad of [0,366,-1,1.4,'2']) assert.equal(infer184({via:184,op:'INFER',observations:[o(bad,true,true)]}).accepted,false);
  assert.equal(infer184({via:184,op:'INFER',observations:[o(1,1,false)]}).error,'INVALID_SENSOR');
  assert.equal(infer184({via:184,op:'INFER',observations:[o(1,true,true)],high:.1,low:.2}).error,'BAD_THRESHOLDS');
});
test('no evidence leads to ABSTAIN, not invented confidence',()=>{
  const r=infer184({via:184,op:'INFER',observations:[o(1,null,null)]});
  assert.equal(r.rows[0].decision,'ABSTAIN');assert.equal(r.rows[0].posterior,null);
});
test('two strong fault signals outweigh quiet signals',()=>{
  const r=infer184({via:184,op:'INFER',observations:[o(1,true,true,35),o(2,false,false,35)]});
  assert.equal(r.rows[0].decision,'ALERT');assert.equal(r.rows[1].decision,'CLEAR');
  assert.ok(r.rows[0].posterior>r.rows[1].posterior);
});
test('one ambiguous signal abstains under conservative thresholds',()=>{
  const r=infer184({via:184,op:'INFER',observations:[o(1,true,null,12)]});
  assert.equal(r.rows[0].decision,'ABSTAIN');
});
test('prior is bounded and increases with age',()=>{
  assert.ok(prior184(0,'GYRO')<prior184(50,'GYRO'));
  assert.ok(prior184(50,'RESERVE')>prior184(50,'GYRO'));
});
test('synthetic worlds reproduce identically by seed',()=>{
  const a=syntheticTrial(184184,.25),b=syntheticTrial(184184,.25);
  assert.deepEqual(a.observations,b.observations);
  assert.deepEqual([...a.truth.entries()],[...b.truth.entries()]);
});
test('inference cannot mutate original 365-cell state',()=>{
  const trial=syntheticTrial(184184,.25), before=trial.core.through184({via:184,op:'VIEW'}).snapshot;
  const result=infer184({via:184,op:'INFER',observations:trial.observations});
  const after=trial.core.through184({via:184,op:'VIEW'}).snapshot;
  assert.equal(result.accepted,true);assert.equal(result.readonly,true);
  assert.equal(before.fingerprint,after.fingerprint);assert.equal(before.logSize,after.logSize);
  assert.equal(before.cycle,after.cycle);assert.equal(after.occupied,365);
});
test('synthetic trial uses only Node 184 for fault injection and truth view',()=>{
  const w=syntheticTrial(184123,.2), status=w.core.through184({via:184,op:'VIEW'}).snapshot;
  assert.equal(status.faults,w.faultCount);
  assert.equal(status.logSize,w.faultCount);
  assert.equal(status.occupied,365);
});
test('predictions contain no hidden fault truth labels',()=>{
  const t=syntheticTrial(18455,.25),result=infer184({via:184,op:'INFER',observations:t.observations});
  assert.equal(result.rows.length,365);
  for(const row of result.rows){for(const forbidden of ['fault','health','target','truth'])assert.equal(Object.hasOwn(row,forbidden),false);}
});
test('scoring measures coverage and probabilistic error separately',()=>{
  const t=syntheticTrial(1197,.25),p=infer184({via:184,op:'INFER',observations:t.observations});
  const s=score184(p,t.truth);
  assert.equal(s.count,365);assert.ok(s.coverage>=0&&s.coverage<=1);
  assert.ok(s.brier>=0&&s.brier<=1);assert.ok(s.priorBrier>=0&&s.priorBrier<=1);
});
test('holdout synthetic probabilities improve Brier over prior on declared model',()=>{
  const b=syntheticBenchmark(20801,40,.25);
  assert.equal(b.totalCells,14600);
  assert.ok(b.brier<b.priorBrier);
  assert.ok(b.alertPrecision>.7);
  assert.ok(b.coverage>.6);
});
test('less sensor coverage increases no-signal abstention',()=>{
  const a=syntheticBenchmark(20801,10,0),b=syntheticBenchmark(20801,10,.5);
  assert.equal(a.missingNoSignal,0);
  assert.ok(b.missingNoSignal>0);
  assert.ok(b.coverage<a.coverage);
});
test('all missing sensors abstain with no guessed posterior',()=>{
  const t=syntheticTrial(3000,1);
  const r=infer184({via:184,op:'INFER',observations:t.observations});
  assert.equal(r.counts.ABSTAIN,365);
  assert.ok(r.rows.every(x=>x.posterior===null));
});
test('mutating the inference output cannot modify hidden truth or core',()=>{
  const t=syntheticTrial(2333,0);
  const before=t.core.through184({via:184,op:'VIEW'}).snapshot;
  const r=infer184({via:184,op:'INFER',observations:t.observations});
  r.rows[0].decision='ALERT';r.rows[0].posterior=1;
  const after=t.core.through184({via:184,op:'VIEW'}).snapshot;
  assert.equal(after.fingerprint,before.fingerprint);
});
