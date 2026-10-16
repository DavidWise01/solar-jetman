import test from 'node:test';
import assert from 'node:assert/strict';
import {NODE,COUNT,BANDS,createTriatomic184} from './engine.mjs';
const view=c=>c.through184({via:NODE,op:'VIEW'}).snapshot;
test('365 slots: exactly three 118-slot branches + 11 reserves',()=>{
  assert.equal(BANDS.reduce((s,b)=>s+b.count,0),365);
  const cells=view(createTriatomic184()).cells;
  for(const b of BANDS)assert.equal(cells.filter(c=>c.band===b.name).length,b.count);
  assert.deepEqual(BANDS.map(x=>x.engine),[-2,0,3,0]);
});
test('only Node 184 permits reads and mutations',()=>{
  const c=createTriatomic184();
  for(const via of [0,183,185,undefined,'184']){
    assert.equal(c.through184({via,op:'VIEW'}).accepted,false);
    assert.equal(c.through184({via,op:'RENEW',tx:`wrong-${via}`}).accepted,false);
  }
  assert.equal(view(c).cycle,0);
});
test('cycles carry exactly 2% average, never fractional cells',()=>{
  const c=createTriatomic184();let renews=[];
  for(let n=1;n<=100;n++){
    const r=c.through184({via:NODE,op:'RENEW',tx:`cycle-${n}`});
    assert.equal(r.accepted,true);assert.equal(r.stats.occupied,COUNT);
    assert.equal(r.event.details.retired.length,r.event.details.created.length);
    assert.ok([7,8].includes(r.event.details.quota));
    for(const band of ['TACH','GYRO','POSI'])assert.ok(r.event.details.retired.some(x=>x.band===band));
    renews.push(r.event.details.quota);
  }
  assert.equal(renews.slice(0,10).reduce((a,b)=>a+b,0),73);
  assert.equal(renews.reduce((a,b)=>a+b,0),730);
  assert.equal(view(c).retiredTotal,730);
  assert.equal(view(c).quotaRemainderTenths,0);
  assert.equal(view(c).logSize,100);
});
test('fault through 184 is prioritized, then cleared on next renewal',()=>{
  const c=createTriatomic184();
  assert.equal(c.through184({via:NODE,op:'FAULT',cell:184,tx:'break'}).accepted,true);
  assert.equal(view(c).verdict,'SERVICE_REQUIRED');
  const r=c.through184({via:NODE,op:'RENEW',tx:'fix'});
  assert.ok(r.event.details.retired.some(x=>x.id===184&&x.fault));
  assert.equal(view(c).faults,0);
});
test('mutating caller snapshots cannot edit private cells',()=>{
  const c=createTriatomic184(),s=view(c);s.cells[0].fault=true;s.cells[0].health=0;s.ledger.push({bad:true});
  assert.equal(view(c).cells[0].fault,false);assert.equal(view(c).logSize,0);
});
test('replay blocked; ledger append-only across reseed',()=>{
  const c=createTriatomic184();
  const first=c.through184({via:NODE,op:'RENEW',tx:'same'});assert.equal(first.accepted,true);
  const before=view(c);
  assert.equal(c.through184({via:NODE,op:'RENEW',tx:'same'}).error,'REPLAY_BLOCKED');
  assert.equal(view(c).fingerprint,before.fingerprint);
  c.through184({via:NODE,op:'RESEED',tx:'reset1'});
  assert.equal(view(c).logSize,2);
  assert.equal(c.through184({via:NODE,op:'RENEW',tx:'same'}).error,'REPLAY_BLOCKED');
});
test('invalid messages and IDs cannot change state',()=>{
  const c=createTriatomic184();
  for(const cell of [-1,0,366,1.1,'3',null])assert.equal(c.through184({via:NODE,op:'FAULT',cell,tx:`bad-${cell}`}).accepted,false);
  assert.equal(c.through184({via:NODE,op:'RENEW'}).accepted,false);
  assert.equal(c.through184({via:NODE,op:'EDIT',tx:'edit'}).accepted,false);
  assert.equal(view(c).logSize,0);
});
test('independence of core instances',()=>{
  const a=createTriatomic184(),b=createTriatomic184();a.through184({via:184,op:'RENEW',tx:'a'});
  assert.equal(view(a).cycle,1);assert.equal(view(b).cycle,0);
});
