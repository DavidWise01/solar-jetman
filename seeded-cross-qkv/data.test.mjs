import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRecord,dataToGrid,makeQKVState,verifyQKV,pointBuffers,sourceCoordinate,stats,makeSyntheticFixture} from './data.mjs';
import {GRID,FAULT_INDEX} from './engine.mjs';
const original=JSON.parse(readFileSync(new URL('./synthetic_qkv_fixture.json',import.meta.url),'utf-8'));
const copy=()=>structuredClone(original);
test('fixture is explicitly NOT trained-model data',()=>assert.equal(original.origin,'synthetic_test_only'));
test('Q/K causal-softmax consistency',()=>{const x=validateRecord(original);assert.equal(x.tokens,8);assert.equal(x.heads,12);assert.ok(x.maxReconstructionError<1e-10);});
test('16,356 outputs are derived resampling, not native source entries',()=>{const x=validateRecord(original);assert.equal(x.measuredPositions,768);assert.equal(dataToGrid(original).length,GRID.total);assert.equal(GRID.total,16356);});
for(const field of ['attention','alignment','value']){
 test(`${field}: 16,356 entries finite`,()=>assert.ok(dataToGrid(original,field).every(Number.isFinite)));
 for(const orient of ['a','b']){
  test(`${field}/${orient}: preservation ACCEPT`,()=>{const r=verifyQKV(makeQKVState(original,field,orient));assert.equal(r.accepted,true);assert.equal(r.crossings,1);assert.equal(r.checked,16356);});
  test(`${field}/${orient}: one-cell REJECT`,()=>{const r=verifyQKV(makeQKVState(original,field,orient,true));assert.equal(r.accepted,false);assert.equal(r.crossings,0);});
 }
}
test('all head point buffers contain every logical cell',()=>{const s=makeQKVState(original);const b=pointBuffers(s);assert.equal(b.count,16356);assert.equal(b.positions.length,49068);});
test('single head selects 29×47 raster',()=>assert.equal(pointBuffers(makeQKVState(original),'9').count,1363));
test('source coordinate maps to actual N×N query/key',()=>{const d=sourceCoordinate(FAULT_INDEX,original);assert.equal(d.head,5);assert.ok(d.query<8&&d.key<8);});
test('entropy is finite and causal',()=>assert.ok(stats(original).meanEntropy>0));
test('tampered Q vector rejected',()=>{const x=copy();x.q[0][3][0]+=300;assert.throws(()=>validateRecord(x),/Q\/K|attention does not agree/);});
test('tampered attention rejected',()=>{const x=copy();x.attention[1][3][1]=0.01;assert.throws(()=>validateRecord(x),/normalized/);});
test('positive probability above diagonal rejected',()=>{const x=copy();x.attention[1][0][1]=0.1;assert.throws(()=>validateRecord(x),/mask/);});
test('wrong dimensionality rejected',()=>{const x=copy();x.k[1][1].pop();assert.throws(()=>validateRecord(x),/vector/);});
test('unknown data origin is visible metadata, not automatically trusted',()=>{const x=copy();x.origin='pretrained_model_qkv';assert.equal(validateRecord(x).declaredOrigin,'pretrained_model_qkv');});

test("browser synthetic demo generated without network validates",()=>{const x=makeSyntheticFixture();assert.equal(x.shape.tokens,5);assert.equal(x.origin,"synthetic_test_only");assert.ok(validateRecord(x).maxReconstructionError<1e-10);});