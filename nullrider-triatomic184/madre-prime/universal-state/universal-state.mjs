/**
 * KET / MADRE PRIME — UNIVERSAL STATE: 10! / 4!
 * Symbolic, deterministic, read-only quotient index, not a physics/quantum model.
 * Node184 is a software routing contract, not a cryptographic authorization layer.
 * Does not modify original 10! playground or triatomic/Mobius engines.
 */
export const NODE = 184;
export const WHOLE = 3_628_800;
export const RESIDUAL_FACTORIAL = 24;
export const STATES = 151_200;
export const LABELS = Object.freeze([0,1,2,3,4,5,6,7,8,9]);
export const PYRAMID = Object.freeze({
  name:'MADRE PRIME', universe:'10! / 4!',
  playground:WHOLE, universalStates:STATES, quotient:RESIDUAL_FACTORIAL,
  selectedPositions:6, residualPositions:4,
  towerBase:366, branches:3, branchPositions:122,
  triatomicOperational:365, scalarZeroAnchor:1, scalarZero:0,
  observationLayers:8, perspectivesPerLayer:4,
  gateway:NODE, readOnly:true, mutablePlayground:false,
  scope:'SYMBOLIC_SOFTWARE'
});
function factorial(n){let value=1;for(let i=2;i<=n;i++)value*=i;return value;}
function arrangements(n,k){return factorial(n)/factorial(n-k);}
function bad(message){throw new RangeError(message);}
function validateSelection(selection){
 if(!Array.isArray(selection)||selection.length!==6||selection.some(x=>!Number.isInteger(x)||x<0||x>9)||new Set(selection).size!==6)bad('SIX_DISTINCT_LABELS_REQUIRED');
}
export function rankUniversal(selection){
 validateSelection(selection);
 const remain=[...LABELS];let rank=0;
 for(let i=0;i<6;i++){
  const j=remain.indexOf(selection[i]);
  rank+=j*arrangements(9-i,5-i);
  remain.splice(j,1);
 }
 return rank;
}
export function unrankUniversal(rank){
 if(!Number.isSafeInteger(rank)||rank<0||rank>=STATES)bad('INVALID_UNIVERSAL_INDEX');
 const remain=[...LABELS],selected=[];let offset=rank;
 for(let i=0;i<6;i++){
  const block=arrangements(9-i,5-i);
  const idx=Math.floor(offset/block);
  offset%=block;
  selected.push(remain.splice(idx,1)[0]);
 }
 return {index:rank,ordinal:rank+1,selection:selected,residual:remain,
    parentPermutationMultiplicity:RESIDUAL_FACTORIAL};
}
export function foldFullPermutation(full){
 if(!Array.isArray(full)||full.length!==10||full.some(x=>!Number.isInteger(x)||x<0||x>9)||new Set(full).size!==10)bad('TEN_DISTINCT_LABELS_REQUIRED');
 return rankUniversal(full.slice(0,6));
}
function response(op,arg){
 if(op==='SPEC')return {accepted:true,readonly:true,node:NODE,op,pyramid:{...PYRAMID}};
 if(op==='RANK'){const index=rankUniversal(arg);return {accepted:true,readonly:true,node:NODE,op,...unrankUniversal(index)};}
 if(op==='UNRANK')return {accepted:true,readonly:true,node:NODE,op,...unrankUniversal(arg)};
 if(op==='FOLD'){const index=foldFullPermutation(arg);return {accepted:true,readonly:true,node:NODE,op,...unrankUniversal(index)};}
 return {accepted:false,error:'UNKNOWN_READ_ONLY_OPERATION'};
}
export function createUniversalState184(){
 return Object.freeze({through184(packet){
  if(!packet||packet.via!==NODE)return {accepted:false,error:'NODE_184_REQUIRED'};
  try{return response(packet.op,packet.selection??packet.index??packet.full);}
  catch(error){return {accepted:false,error:error.message};}
 }});
}
if(WHOLE/RESIDUAL_FACTORIAL!==STATES||arrangements(10,6)!==STATES||PYRAMID.towerBase/PYRAMID.branches!==122)throw new Error('INVARIANT_VIOLATION');
