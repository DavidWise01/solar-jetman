import test from 'node:test';import assert from 'node:assert/strict';
import {GATE,WIDTH,CELL_COUNT,TRIATOMIC_SLOTS,packA,swapAtX,spinorTurns,viewThroughMobius,unviewMobius,unpackA,routeAtoB,checkRestoration,showAsUTF8} from './engine.mjs';
const payloads=['','a','a'.repeat(64),'a'.repeat(65),'🚀🌙 𐌰 hello \0 worlds','x'.repeat(4000)];
test('canonical scalar counts and gateway',()=>{assert.equal(GATE,184);assert.equal(WIDTH,8);assert.equal(CELL_COUNT,64);assert.equal(TRIATOMIC_SLOTS,365);assert.throws(()=>packA('x',185),/GATE_184/);assert.throws(()=>swapAtX(packA('ok'),7),/GATE_184/)});
test('X exchange is transposition of 8x8 and involution',()=>{
 const p=packA(Uint8Array.from({length:64},(_,i)=>i));const q=swapAtX(p);
 for(let i=0;i<8;i++)for(let j=0;j<8;j++)assert.equal(q.blocks[0][j][i],i*8+j);
 assert.deepEqual(swapAtX(q).blocks,p.blocks);
});
for(const turns of [0,1,2,3,4,7,8])for(const payload of payloads){
 test(`restore exact bytes through X and Möbius at turns=${turns}, payloadBytes=${new TextEncoder().encode(payload).length}`,()=>{
 const tx=routeAtoB(payload,turns);assert.equal(tx.preserved,true);
 assert.equal(showAsUTF8(tx.restored),payload);
 assert.equal(checkRestoration(payload,tx.visibleB).accepted,true);
 });
}
test('spinor sign has 720-degree closure',()=>{
 assert.deepEqual(spinorTurns(0),{turns:0,mobiusTwisted:false,spinorSign:1,restored:true});
 assert.equal(spinorTurns(1).spinorSign,-1);assert.equal(spinorTurns(1).mobiusTwisted,true);
 assert.equal(spinorTurns(2).spinorSign,1);assert.equal(spinorTurns(2).restored,true);
 assert.equal(spinorTurns(3).spinorSign,-1);
});
test('Möbius view reverses local coordinates at 360 degrees',()=>{
 const p=swapAtX(packA(Uint8Array.from({length:64},(_,i)=>i)));
 const v=viewThroughMobius(p,1);assert.equal(v.blocks[0][0][0],p.blocks[0][0][7]);
 assert.deepEqual(unviewMobius(v).blocks,p.blocks);
});
test('one modified byte in B is rejected',()=>{
 const z=routeAtoB('Möbius spinor preservation',1);z.visibleB.blocks[0][1][2]^=1;
 assert.equal(checkRestoration('Möbius spinor preservation',z.visibleB).accepted,false);
});
test('spoofed spinor metadata is rejected',()=>{
 const z=routeAtoB('test',1);z.visibleB.spinorSign=+1;
 assert.match(checkRestoration('test',z.visibleB).error,/INVALID_MOBIUS_FRAME/);
});
test('truncated blocks rejected',()=>{
 const z=routeAtoB('x'.repeat(80),0);z.visibleB.blocks.pop();
 assert.match(checkRestoration('x'.repeat(80),z.visibleB).error,/INVALID_PACKET/);
});
test('nonzero padding rejected',()=>{
 const z=routeAtoB('x',0);z.visibleB.blocks[0][7][7]=255;
 assert.equal(checkRestoration('x',z.visibleB).accepted,false);
});
test('invalid turns rejected',()=>{
 assert.throws(()=>spinorTurns(-1),/INVALID_TURNS/);assert.throws(()=>spinorTurns(.5),/INVALID_TURNS/);
});
