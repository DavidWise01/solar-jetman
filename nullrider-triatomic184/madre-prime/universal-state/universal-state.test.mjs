import test from 'node:test';
import assert from 'node:assert/strict';
import {NODE,WHOLE,STATES,RESIDUAL_FACTORIAL,PYRAMID,rankUniversal,unrankUniversal,foldFullPermutation,createUniversalState184} from './universal-state.mjs';

test('frozen 10! playground and the derived 10!/4! state count',()=>{
 assert.equal(WHOLE,3628800);
 assert.equal(STATES,151200);
 assert.equal(RESIDUAL_FACTORIAL,24);
 assert.equal(STATES*RESIDUAL_FACTORIAL,WHOLE);
});
test('existing Madre structural constants remain separate',()=>{
 assert.equal(PYRAMID.towerBase,366);assert.equal(PYRAMID.branches,3);
 assert.equal(PYRAMID.branchPositions,122);assert.equal(PYRAMID.triatomicOperational,365);
 assert.equal(PYRAMID.scalarZeroAnchor,1);assert.equal(PYRAMID.gateway,184);
 assert.equal(PYRAMID.observationLayers*PYRAMID.perspectivesPerLayer,32);
});
test('first and last lexicographic universal addresses',()=>{
 assert.deepEqual(unrankUniversal(0).selection,[0,1,2,3,4,5]);
 assert.deepEqual(unrankUniversal(0).residual,[6,7,8,9]);
 assert.deepEqual(unrankUniversal(STATES-1).selection,[9,8,7,6,5,4]);
 assert.equal(rankUniversal([9,8,7,6,5,4]),STATES-1);
});
test('all 151200 universal states rank/unrank uniquely and exactly',()=>{
 const seen=new Uint8Array(STATES);
 for(let index=0;index<STATES;index++){
  const state=unrankUniversal(index);
  const reverse=rankUniversal(state.selection);
  assert.equal(reverse,index);
  assert.equal(seen[reverse]++,0);
  assert.equal(state.residual.length,4);
 }
 assert.equal(seen.every(v=>v===1),true);
});
test('all 24 permutations of the residual four collapse to one universal state',()=>{
 const head=[3,1,4,0,5,2],tail=[6,7,8,9],target=rankUniversal(head);
 const permutations=[];
 const collect=(prefix,remaining)=>{if(!remaining.length){permutations.push(prefix);return;}
  remaining.forEach((v,i)=>collect([...prefix,v],[...remaining.slice(0,i),...remaining.slice(i+1)]));};
 collect([],tail);
 assert.equal(permutations.length,24);
 for(const p of permutations)assert.equal(foldFullPermutation([...head,...p]),target);
});
test('different selected six positions can differ even when residual is unordered',()=>{
 assert.notEqual(rankUniversal([0,1,2,3,4,5]),rankUniversal([0,1,2,3,5,4]));
});
test('index out-of-bounds, invalid permutations, and duplicate labels reject',()=>{
 for(const i of [-1,151200,1.5,NaN,Infinity,'0'])assert.throws(()=>unrankUniversal(i),/INVALID_UNIVERSAL_INDEX/);
 for(const a of [[0,1,2,3,4,4],[0,1,2,3,4],[0,1,2,3,4,10]])assert.throws(()=>rankUniversal(a),/SIX_DISTINCT_LABELS_REQUIRED/);
 assert.throws(()=>foldFullPermutation([0,1,2,3,4,5,6,7,8,8]),/TEN_DISTINCT_LABELS_REQUIRED/);
});
test('all operations pass through Node 184 and are read only',()=>{
 const engine=createUniversalState184();
 assert.equal(engine.through184({via:183,op:'SPEC'}).accepted,false);
 assert.equal(engine.through184({via:NODE,op:'SPEC'}).pyramid.universalStates,STATES);
 const v=engine.through184({via:NODE,op:'UNRANK',index:77777});
 assert.equal(v.accepted,true);assert.equal(v.readonly,true);
 assert.equal(engine.through184({via:NODE,op:'RANK',selection:v.selection}).index,77777);
 assert.equal(engine.through184({via:NODE,op:'FOLD',full:[...v.selection,...v.residual]}).index,77777);
 assert.equal(engine.through184({via:NODE,op:'RENEW'}).accepted,false);
});
test('returned state mutation does not alter the frozen mapping',()=>{
 const engine=createUniversalState184();
 const u=engine.through184({via:184,op:'UNRANK',index:0});
 u.selection[0]=9;u.residual[0]=0;
 const v=engine.through184({via:184,op:'UNRANK',index:0});
 assert.deepEqual(v.selection,[0,1,2,3,4,5]);assert.deepEqual(v.residual,[6,7,8,9]);
});
