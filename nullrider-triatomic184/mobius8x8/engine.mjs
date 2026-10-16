/* NULLRIDER Möbius 8x8 X-exchange: symbolic software geometry, not electron dynamics. */
export const GATE=184, WIDTH=8, CELL_COUNT=64, TRIATOMIC_SLOTS=3*118+11;
const utf8=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
function assertGate(gate){if(gate!==GATE)throw new Error('GATE_184_REQUIRED');}
function isBytes(b){return b instanceof Uint8Array;}
const asBytes=(v)=>typeof v==='string'?utf8.encode(v):isBytes(v)?new Uint8Array(v):(()=>{throw new TypeError('UTF8_STRING_OR_BYTES_REQUIRED')})();
const isMatrix=b=>Array.isArray(b)&&b.length===WIDTH&&b.every(row=>Array.isArray(row)&&row.length===WIDTH&&row.every(v=>Number.isInteger(v)&&v>=0&&v<=255));
function blockize(bytes){
 const blocks=[];
 for(let from=0;from<bytes.length;from+=CELL_COUNT){
  const block=new Uint8Array(CELL_COUNT);block.set(bytes.subarray(from,from+CELL_COUNT));
  blocks.push(Array.from({length:8},(_,i)=>Array.from(block.subarray(i*8,i*8+8))));
 }
 return blocks;
}
const flatten=blocks=>Uint8Array.from(blocks.flatMap(m=>m.flat()));
function assertPacket(p){
 if(!p||!Number.isSafeInteger(p.length)||p.length<0||!Array.isArray(p.blocks)||p.blocks.length!==Math.ceil(p.length/CELL_COUNT)||!p.blocks.every(isMatrix))throw new Error('INVALID_PACKET');
}
export function packA(value,gate=GATE){assertGate(gate);const bytes=asBytes(value);return {shape:'8x8',length:bytes.length,blocks:blockize(bytes),side:'A'};}
export function swapAtX(packet,gate=GATE){
 assertGate(gate);assertPacket(packet);
 const blocks=packet.blocks.map(m=>Array.from({length:8},(_,row)=>Array.from({length:8},(_,col)=>m[col][row])));
 return {shape:'8x8',length:packet.length,blocks,side:packet.side==='A'?'B':'A'};
}
export function spinorTurns(turns){
 if(!Number.isSafeInteger(turns)||turns<0)throw new Error('INVALID_TURNS');
 return {turns,mobiusTwisted:Boolean(turns%2),spinorSign:turns%2===0?1:-1,restored:turns%2===0};
}
export function viewThroughMobius(packet,turns,gate=GATE){
 assertGate(gate);assertPacket(packet);const state=spinorTurns(turns);
 const blocks=packet.blocks.map(m=>state.mobiusTwisted?m.map(row=>row.toReversed()):m.map(row=>row.slice()));
 return {...packet,blocks,viewTurns:turns,spinorSign:state.spinorSign};
}
export function unviewMobius(view,gate=GATE){
 assertGate(gate);assertPacket(view);
 if(!Number.isSafeInteger(view.viewTurns)||view.viewTurns<0||![1,-1].includes(view.spinorSign)||view.spinorSign!==spinorTurns(view.viewTurns).spinorSign)throw new Error('INVALID_MOBIUS_FRAME');
 return {shape:'8x8',length:view.length,blocks:view.blocks.map(m=>view.viewTurns%2?m.map(row=>row.toReversed()):m.map(row=>row.slice())),side:view.side};
}
export function unpackA(packet,gate=GATE){
 assertGate(gate);assertPacket(packet);if(packet.side!=='A')throw new Error('EXPECTED_A_SIDE');
 const bytes=flatten(packet.blocks);
 if(bytes.slice(packet.length).some(b=>b!==0))throw new Error('PADDING_CORRUPTED');
 return bytes.slice(0,packet.length);
}
export function routeAtoB(value,turns=0,gate=GATE){
 const packedA=packA(value,gate),packedB=swapAtX(packedA,gate),visibleB=viewThroughMobius(packedB,turns,gate);
 const original=asBytes(value),restored=unpackA(swapAtX(unviewMobius(visibleB,gate),gate),gate);
 return {packedA,packedB,visibleB,turns,preserved:equalBytes(original,restored),original,restored};
}
export function equalBytes(a,b){return isBytes(a)&&isBytes(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);}
export function showAsUTF8(b){return decoder.decode(b);}
export function checkRestoration(value,visibleB,gate=GATE){
 const orig=asBytes(value);
 try{const b=unpackA(swapAtX(unviewMobius(visibleB,gate),gate),gate);return {accepted:equalBytes(orig,b),restored:b};}
 catch(e){return {accepted:false,error:e.message};}
}
