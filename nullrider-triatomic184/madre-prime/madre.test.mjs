import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MADRE,FRAME,createMadrePrimeTower} from './madre.mjs';
const newTower=()=>createMadrePrimeTower();
const view=t=>t.through184({via:184,op:'VIEW'});

test('canonical 366/3 produces exactly three 122-slot branches',()=>{
 assert.equal(MADRE.base,366);assert.equal(MADRE.perBranch,122);assert.equal(MADRE.branches,3);
 assert.equal(MADRE.base/MADRE.branches,122);
 assert.deepEqual([...MADRE.spire],[66,36,6,6,3,1,1]);
 assert.deepEqual([...MADRE.toroids],['{{1x1}}^1','{{3x3}}^3','{{5x5}}^5']);
 assert.deepEqual([...MADRE.boxes],['{{2x2}}^2','{{4x4}}^4','{{6x6}}^6']);
 assert.deepEqual([...MADRE.axes],['+x','-x','+y','-y','+z','-z']);
 assert.equal(MADRE.throughHole,'OPEN');
});
test('each branch has 118 cells plus four structural positions',()=>{
 const m=newTower().through184({via:184,op:'AUDIT'});
 assert.equal(m.accepted,true);assert.equal(m.mapping.length,366);
 for(const b of ['TACH','GYRO','POSI']){
  const a=m.mapping.filter(x=>x.branch===b);
  assert.equal(a.length,122);assert.equal(a.filter(x=>x.kind==='TRIATOMIC').length,118);
  assert.equal(a.filter(x=>x.kind!=='TRIATOMIC').length,4);
 }
 assert.equal(m.mapping.filter(x=>x.kind==='SHARED_RESERVE').length,11);
 assert.equal(m.mapping.filter(x=>x.kind==='SCALAR_ZERO').length,1);
 assert.deepEqual(m.mapping.filter(x=>x.cellId!==null).map(x=>x.cellId).sort((a,b)=>a-b),Array.from({length:365},(_,i)=>i+1));
 assert.equal(m.mapping[365].cellId,null);
});
test('Node 184 is not the same thing as cell 184 or tower slot 184',()=>{
 const t=newTower();
 assert.equal(t.through184({via:183,op:'VIEW'}).error,'GATE_184_REQUIRED');
 assert.equal(t.through184({via:184,op:'LOCATE',address:184}).cellId,180);
 assert.equal(t.through184({via:184,op:'CELL_ADDRESS',cellId:184}).address,188);
 assert.equal(t.through184({via:184,op:'LOCATE',address:366}).kind,'SCALAR_ZERO');
});
test('time and engine triads pinned, with distinct scalar centre',()=>{
 assert.deepEqual([...FRAME.temporal],[-1,0,1]);assert.deepEqual([...FRAME.engines],[-2,0,3]);
 assert.equal(FRAME.scalar,0);assert.equal(FRAME.entryDeg,7.5);assert.equal(FRAME.spinorClosureDeg,720);
});
for(const turns of [0,1,2])test(`Möbius 8×8, ${turns*360}° preserves Unicode and core`,()=>{
 const t=newTower(),cargo='TACH -2 | GYRO 0 | POSI +3 : {{ -{+{=}} }} : 零🌙'.repeat(5);
 const before=view(t).stats.fingerprint;
 const res=t.through184({via:184,op:'SWAP',tx:`ok${turns}`,turns,cargo});
 assert.equal(res.accepted,true);assert.equal(res.receipt.crossings,1);
 assert.deepEqual(res.original,res.restored);assert.equal(res.receipt.spinorSign,turns%2?-1:1);
 assert.equal(view(t).stats.fingerprint,before);
});
test('fault at X rejects crossing and consumes transaction id',()=>{
 const t=newTower();const res=t.through184({via:184,op:'SWAP',tx:'bad',turns:1,cargo:'abc',injectFault:true});
 assert.equal(res.accepted,false);assert.equal(res.receipt.crossings,0);
 assert.equal(t.through184({via:184,op:'SWAP',tx:'bad',turns:1,cargo:'abc'}).error,'REPLAY_BLOCKED');
});
test('renew 10 cycles: 73 slots, 365 operational cells, anchor untouched',()=>{
 const t=newTower();t.through184({via:184,op:'FAULT',tx:'fault',cell:184});let sum=0;
 for(let n=0;n<10;n++){
  const res=t.through184({via:184,op:'RENEW',tx:`renew${n}`});assert.equal(res.accepted,true);sum+=res.event.details.quota;
  assert.equal(res.stats.occupied,365);
 }
 assert.equal(sum,73);assert.equal(view(t).stats.faults,0);
 assert.equal(t.through184({via:184,op:'LOCATE',address:366}).cellId,null);
});
test('inference read-only; proxy evidence explicitly labeled',()=>{
 const t=newTower(),before=view(t).stats.fingerprint;
 const inf=t.through184({via:184,op:'INFER'});
 assert.equal(inf.accepted,true);assert.equal(inf.count,365);
 assert.equal(inf.coreUnchanged,true);assert.match(inf.source,/PROXY/);
 assert.equal(view(t).stats.fingerprint,before);
});
test('reject invalid addresses, wrong gate, missing tx, bad turns',()=>{
 const t=newTower();
 assert.equal(t.through184({via:184,op:'LOCATE',address:367}).error,'BAD_TOWER_ADDRESS');
 assert.equal(t.through184({via:184,op:'CELL_ADDRESS',cellId:366}).error,'BAD_CELL_ID');
 assert.equal(t.through184({via:184,op:'SWAP',cargo:'a',turns:0}).error,'TX_REQUIRED');
 assert.equal(t.through184({via:184,op:'SWAP',tx:'t',cargo:'a',turns:3}).error,'TURNS_MUST_BE_0_1_2');
 for(const op of ['VIEW','RENEW','SWAP','INFER','LOCATE'])assert.equal(t.through184({via:182,op}).error,'GATE_184_REQUIRED');
});

test('read-only preview opens without producing a crossing receipt',()=>{const t=newTower();const p=t.through184({via:184,op:'PREVIEW',cargo:'hello',turns:1});assert.equal(p.accepted,true);assert.equal(p.readonly,true);assert.equal(p.matrixA.length,8);assert.equal(p.matrixB.length,8);assert.equal(view(t).receipts.length,0);});
