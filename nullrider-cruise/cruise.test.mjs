import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ENGINE,ROLL,MOATS,GRID,shellPair,selectTemporal,laneSample,receiptOverlay,verifyOverlay,normalizeDegree} from './cruise.mjs';
import {rendezvous,packBranch,unpackBranch,equalBytes} from './engine.mjs';

for(const [temporal,value,engine] of [[-1,-2,'TACH'],[0,0,'GYRO'],[1,3,'POSI']])test(`time ${temporal} / engine ${value}`,()=>{assert.equal(selectTemporal(temporal).value,value);assert.equal(selectTemporal(temporal).engine,engine);});
test('temporal mismatch blocked',()=>assert.throws(()=>selectTemporal(2),/UNKNOWN_TEMPORAL/));
test('canonical 5/3/1 and fortress 9/7/5/3/1 distinct',()=>{assert.deepEqual(ROLL,[5,3,1]);assert.deepEqual(MOATS,[9,7,5,3,1]);});
test('16,356 projection count',()=>assert.equal(GRID.heads*GRID.rows*GRID.cols,GRID.total));
for(let n=0;n<=104;n++)test(`mirror shell ${n}`,()=>{const s=shellPair(n);assert.equal(s.aDegrees,normalizeDegree(10*n));assert.equal(s.bDegrees,normalizeDegree(-10*n));assert.equal(s.mirrorInvariant,true);});
test('shell 31 maps 310° + 50°',()=>assert.deepEqual([shellPair(31).aDegrees,shellPair(31).bDegrees],[310,50]));
test('signed register has 208 addresses and one center',()=>{const s=shellPair(104);assert.equal(s.addresses,208);assert.equal(s.scalar,0)});
test('illegal shell boundaries reject',()=>{for(const n of [-1,105,1.1,Infinity])assert.throws(()=>shellPair(n),/SHELL_OUT_OF_RANGE/);});
test('8 concurrent lanes deterministic',()=>{const a=laneSample('test',6);assert.equal(a.length,8);assert.deepEqual(a,laneSample('test',6));assert.notDeepEqual(a,laneSample('tEst',6));});
test('context overlay immutable shape across all temporal states',()=>{for(const t of [-1,0,1])assert.equal(verifyOverlay(receiptOverlay({temporal:t,shell:31,head:7,speed:1.25})),true);});
test('altered coordinate never silently repairs',()=>{const o={...receiptOverlay(),engine_coordinate:2};assert.equal(verifyOverlay(o),false);});
test('altered layout and shell never silently repairs',()=>{assert.equal(verifyOverlay({...receiptOverlay(),registry_addresses:209}),false);assert.equal(verifyOverlay({...receiptOverlay(),shell_a_degrees:0}),false);});
test('strict verification independent of optional cruise overlay',async()=>{const accept=await rendezvous('cargo🌙');assert.equal(accept.record.status,'ACCEPT');const reject=await rendezvous('cargo🌙',{fault:true});assert.equal(reject.record.status,'REJECT');assert.equal(reject.record.seam_crossings,0);});
test('UTF-8 stays intact through both branches',()=>{const text='🛰️|0|−2|0|+3\nline two\0';const b=new TextEncoder().encode(text);for(const branch of ['A','B'])assert.ok(equalBytes(b,unpackBranch(packBranch(b,branch),branch)));});
