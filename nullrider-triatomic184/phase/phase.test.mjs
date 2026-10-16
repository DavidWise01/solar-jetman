import test from 'node:test';
import assert from 'node:assert/strict';
import {phaseState184,inferPhase184} from './phase.mjs';
import {newWorld,evaluateWorld,runBench} from './benchmark.mjs';
import {infer184} from '../infer/infer.mjs';

const v=(id,phase,extras={})=>({id,band:'TACH',age:12,alarm:true,drift:false,phase,...extras});
const pair=(a=0,b=180)=>[{angle:a,value:.3},{angle:b,value:-.2}];
const valid={via:184,op:'INFER_PHASE',mode:'COUNTER_ROTATING',observations:[v(1,pair())]};

test('opposite spin frames meet at 0 and 180 degrees',()=>{
  assert.equal(phaseState184(0).aligned,true);
  assert.equal(phaseState184(180).aligned,true);
  assert.equal(phaseState184(90).aligned,false);
  assert.equal(phaseState184(3.75).aligned,true);
  assert.equal(phaseState184(3.76).aligned,false);
  assert.equal(phaseState184(183.75).aligned,true);
  assert.equal(phaseState184(183.76).aligned,false);
  assert.ok(Math.abs(phaseState184(180).relativeDeg)<1e-9);
});
test('access requires Node 184',()=>{
  for(const via of [0,183,185,'184',null]) assert.equal(inferPhase184({...valid,via}).error,'WRONG_GATE_EXPECTED_184');
});
test('only read-only inference operation is allowed',()=>{
  for(const op of ['FAULT','RENEW','VIEW','INFER','RESEED']) assert.equal(inferPhase184({...valid,op}).error,'READ_ONLY_INFERENCE');
});
test('invalid modes and fault truth labels rejected',()=>{
  assert.equal(inferPhase184({...valid,mode:'MAGIC'}).error,'BAD_MODE');
  for(const field of ['fault','health','target','truth','version']){
    const q=inferPhase184({...valid,observations:[v(1,pair(),{[field]:true})]});
    assert.equal(q.error,'UNEXPECTED_FIELD_OR_TRUTH_LEAK');
  }
});
test('phase gate blocks samples outside window',()=>{
  for(const a of [90,10,181+8]){
    assert.equal(inferPhase184({...valid,observations:[v(1,pair(0,a))]}).accepted,false);
  }
});
test('mode-specific phase positions cannot be spoofed',()=>{
  assert.equal(inferPhase184({...valid,mode:'STATIONARY'}).error,'INVALID_STATIONARY_PHASE');
  assert.equal(inferPhase184({...valid,mode:'COUNTER_ROTATING',observations:[v(1,pair(180,0))]}).error,'INVALID_ROTATING_PHASE');
});
test('bad values, nonfinite model and duplicate IDs rejected',()=>{
  assert.equal(inferPhase184({...valid,observations:[v(1,[{angle:0,value:NaN},{angle:180,value:1}])]}).error,'BAD_PHASE_VALUE');
  assert.equal(inferPhase184({...valid,sigmaNoise:0}).error,'INVALID_MODEL');
  assert.equal(inferPhase184({...valid,observations:[v(1,pair()),v(1,pair())]}).error,'DUPLICATE_ID');
});
test('same synthetic world reproducible',()=>{
  const a=newWorld(222001),b=newWorld(222001);
  assert.deepEqual(a.stationary,b.stationary);
  assert.deepEqual(a.rotating,b.rotating);
  assert.deepEqual([...a.truth],[...b.truth]);
});
test('two sample counts equal and sealed sensor budgets',()=>{
  const w=newWorld(222001);
  assert.equal(w.stationary.length,365);assert.equal(w.rotating.length,365);
  for(let i=0;i<365;i++){
    assert.equal(w.stationary[i].phase.length,2);
    assert.equal(w.rotating[i].phase.length,2);
    assert.equal(w.stationary[i].phase[0].value,w.rotating[i].phase[0].value);
    for(const x of [w.stationary[i],w.rotating[i]]){
      for(const k of ['fault','health','target','truth']) assert.ok(!Object.hasOwn(x,k));
    }
  }
});
test('phase inference never mutates original Node 184 state',()=>{
  const w=newWorld(222001);
  const before=w.core.through184({via:184,op:'VIEW'}).snapshot;
  const q=inferPhase184({via:184,op:'INFER_PHASE',mode:'COUNTER_ROTATING',observations:w.rotating});
  const after=w.core.through184({via:184,op:'VIEW'}).snapshot;
  assert.equal(q.accepted,true); assert.equal(q.readonly,true);
  assert.equal(before.fingerprint,after.fingerprint);
  assert.equal(before.cycle,after.cycle);
  assert.equal(before.logSize,after.logSize);
  assert.equal(after.occupied,365);
});
test('null phase signal has no inference advantage',()=>{
  const w=newWorld(222001,0,true),e=evaluateWorld(w,0);
  assert.ok(Math.abs(e.brierRotating-e.brierStationary)<1e-12);
  assert.equal(e.hitsRotating,e.hitsStationary);
});
test('counterrotating assumption violation can hurt rather than help',()=>{
  const result=runBench();
  assert.deepEqual(result.quotasFirst10,[7,7,7,8,7,7,8,7,7,8]);
  assert.equal(result.main.exactTwoPercentBudget.totalSlots,730);
  assert.equal(result.main.populationPreserved,true);
  assert.equal(result.main.cells,36500);
  assert.ok(result.main.brier.rotating<result.main.brier.stationary);
  assert.equal(result.nullControl.brier.absoluteImprovement,0);
  assert.equal(result.nullControl.exactTwoPercentBudget.improvementInHits,0);
  assert.ok(result.assumptionViolation.brier.rotating>result.assumptionViolation.brier.stationary);
});
test('same model results are deterministic over repeated seeded evaluation',()=>{
  const a=evaluateWorld(newWorld(222002));const b=evaluateWorld(newWorld(222002));
  assert.deepEqual(a,b);
});
test('all 3 main branches included in capped top-k maintenance selection',()=>{
  const w=newWorld(222003),e=evaluateWorld(w);
  assert.equal(e.quota,7);
  assert.equal(e.population,365);
  const a=inferPhase184({via:184,op:'INFER_PHASE',mode:'STATIONARY',observations:w.stationary});
  assert.equal(new Set(a.rows.map(x=>x.band)).size,4);
});
