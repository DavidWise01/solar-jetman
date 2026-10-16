/* NULLRIDER — Madre Prime Tower / triatomic 366 ÷ 3 integration.
 * User's symbolic kernel, not a literal atomic or Planck-scale model.
 * All external operations pass through logical Node 184.
 * No mutation of imported source modules.
 */
import {createTriatomic184, COUNT as TRIATOMIC_COUNT} from '../engine.mjs';
import {packA,swapAtX,viewThroughMobius,routeAtoB,checkRestoration,spinorTurns,GATE as X_GATE} from '../mobius8x8/engine.mjs';
import {infer184} from '../infer/infer.mjs';

export const NODE=184;
export const MADRE=Object.freeze({
 name:'MADRE PRIME', base:366, branches:3, perBranch:122,
 spire:Object.freeze([66,36,6,6,3,1,1]),
 toroids:Object.freeze(['{{1x1}}^1','{{3x3}}^3','{{5x5}}^5']),
 boxes:Object.freeze(['{{2x2}}^2','{{4x4}}^4','{{6x6}}^6']),
 axes:Object.freeze(['+x','-x','+y','-y','+z','-z']),
 origin:0, throughHole:'OPEN', rule:'AS_ABOVE_SO_BELOW'
});
export const FRAME=Object.freeze({
 gate:NODE,scalar:0,temporal:Object.freeze([-1,0,1]),engines:Object.freeze([-2,0,3]),
 branches:Object.freeze(['TACH','GYRO','POSI']), activePerBranch:118,
 sharedReserve:11, anchorPositions:1, entryDeg:7.5,exitDeg:7.5,
 exchange:Object.freeze([8,8]),spinorClosureDeg:720,renewalAveragePercent:2,
 stage:'SYMBOLIC_SOFTWARE'
});

// Three equal 122-position arms. Each arm has 118 ordinary slots and four
// structural positions; 11 map to existing shared reserves, the last is 0.
// The anchor is never given a cell ID and never gets renewed.
const MAP=Object.freeze(Array.from({length:366},(_,ix)=>{
 const branch=Math.floor(ix/122),slot=ix%122+1,address=ix+1;
 const isOrdinary=slot<=118;
 const extra=branch*4+slot-118; // 1..12
 const anchor=!isOrdinary&&extra===12;
 const id=isOrdinary?branch*118+slot:anchor?null:354+extra;
 return Object.freeze({address,branch:FRAME.branches[branch],slot,kind:anchor?'SCALAR_ZERO':isOrdinary?'TRIATOMIC':'SHARED_RESERVE',cellId:id,scalar:anchor?0:null});
}));
const cellMap=new Map(MAP.filter(x=>x.cellId!==null).map(x=>[x.cellId,x]));
function gate(packet){return !packet||packet.via!==NODE?{accepted:false,error:'GATE_184_REQUIRED'}:null;}
function sensorPreview(snapshot){
 // PROXY FROM INTERNAL STATE, not an independent sensor. No hidden-label tests here.
 return snapshot.cells.map(c=>({id:c.id,band:c.band,age:Math.min(50,c.age),
   alarm:c.health<92,drift:c.age>=12}));
}
function verifyMapping(){
 if(MADRE.base/MADRE.branches!==122||MAP.length!==366||TRIATOMIC_COUNT!==365||cellMap.size!==365)throw Error('INVALID_TOWER_MAP');
 for(let id=1;id<=365;id++)if(!cellMap.has(id))throw Error('MISSING_CELL_ID');
 if(MAP[365].kind!=='SCALAR_ZERO'||MAP[365].cellId!==null||MAP.filter(x=>x.kind==='SHARED_RESERVE').length!==11)throw Error('ANCHOR_OR_RESERVE_MISASSIGNED');
 return {base:366,branches:3,perBranch:122,activePerBranch:118,branchExtras:4,reserves:11,anchor:1,
    ordinary:354, mappedCoreCells:365,unassigned:0,centre:'SCALAR_ZERO_POSITION_366_NOT_A_CELL',
    note:'366/3=122 per arm. The 12 structural positions represent 11 shared reserves and one non-renewable zero anchor.'};
}
export function createMadrePrimeTower(){
 const core=createTriatomic184();const swaps=new Set(),receipts=[];let serial=0;
 function through184(packet){
  const err=gate(packet);if(err)return err;
  const op=packet.op;
  if(op==='AUDIT'||op==='VIEW'){
   const snap=core.through184({via:NODE,op:'VIEW'}).snapshot;
   return {accepted:true,readonly:true,node:NODE,op,madre:MADRE,frame:FRAME,bridge:verifyMapping(),
     stats:snap,receipts:receipts.map(r=>({...r})),
     mapping:op==='AUDIT'?MAP.map(x=>({...x})):undefined};
  }
  if(op==='LOCATE'){
   if(!Number.isInteger(packet.address)||packet.address<1||packet.address>366)return {accepted:false,error:'BAD_TOWER_ADDRESS'};
   return {accepted:true,readonly:true,node:NODE,...MAP[packet.address-1]};
  }
  if(op==='CELL_ADDRESS'){
   if(!Number.isInteger(packet.cellId)||packet.cellId<1||packet.cellId>365)return {accepted:false,error:'BAD_CELL_ID'};
   return {accepted:true,readonly:true,node:NODE,...cellMap.get(packet.cellId)};
  }
  if(op==='INFER'){
   const before=core.through184({via:NODE,op:'VIEW'}).snapshot;
   const result=infer184({via:NODE,op:'INFER',observations:sensorPreview(before),high:packet.high??0.8,low:packet.low??0.08});
   const after=core.through184({via:NODE,op:'VIEW'}).snapshot;
   return {...result,source:'INTERNAL_STATE_DERIVED_PROXY_NOT_INDEPENDENT_SENSORS',coreUnchanged:before.fingerprint===after.fingerprint};
  }
  if(op==='PREVIEW'){
   if(typeof packet.cargo!=='string')return {accepted:false,error:'CARGO_MUST_BE_TEXT'};
   const turns=packet.turns??0;
   if(![0,1,2].includes(turns))return {accepted:false,error:'TURNS_MUST_BE_0_1_2'};
   const a=packA(packet.cargo,NODE),b=viewThroughMobius(swapAtX(a,NODE),turns,NODE);
   return {accepted:true,readonly:true,node:NODE,matrixA:a.blocks[0]??null,matrixB:b.blocks[0]??null,blocks:a.blocks.length};
  }
  if(op==='SWAP'){
   if(typeof packet.tx!=='string'||!packet.tx.trim())return {accepted:false,error:'TX_REQUIRED'};
   if(swaps.has(packet.tx))return {accepted:false,error:'REPLAY_BLOCKED'};
   if(typeof packet.cargo!=='string')return {accepted:false,error:'CARGO_MUST_BE_TEXT'};
   if(![0,1,2].includes(packet.turns))return {accepted:false,error:'TURNS_MUST_BE_0_1_2'};
   if(X_GATE!==NODE)throw Error('SWAP_GATE_MISMATCH');
   const r=routeAtoB(packet.cargo,packet.turns,NODE);
   if(packet.injectFault&&r.visibleB.blocks.length)r.visibleB.blocks[0][0][0]^=1;
   const restored=checkRestoration(packet.cargo,r.visibleB,NODE);
   const accepted=Boolean(restored.accepted&&r.preserved&&!packet.injectFault);
   swaps.add(packet.tx);
   const receipt={serial:++serial,tx:packet.tx,via:NODE,type:'MOBIUS_8X8_SWAP',
     from:'CUBI_A',to:'CUBI_B',turns:packet.turns,spinorSign:spinorTurns(packet.turns).spinorSign,
     byteLength:r.original.length,blocks:r.packedA.blocks.length,crossings:accepted?1:0,
     accepted,verdict:accepted?'ACCEPT':'REJECT',coreWrite:false,
     proof:'LOCAL_EXACT_BYTE_COMPARISON_NOT_SIGNED_NOT_REMOTE'};
   receipts.push(receipt);
   return {accepted,receipt,restored:restored.restored?[...restored.restored]:null,
     original:[...r.original],matrixA:r.packedA.blocks[0]??null,matrixB:r.visibleB.blocks[0]??null};
  }
  if(['RENEW','FAULT','RESEED'].includes(op))return core.through184(packet);
  return {accepted:false,error:'UNKNOWN_OPERATION'};
 }
 verifyMapping();
 return Object.freeze({through184});
}
