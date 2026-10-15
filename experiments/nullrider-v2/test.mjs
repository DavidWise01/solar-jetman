import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,readdir,rm } from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,createPublicKey} from 'node:crypto';
import {makeReceiver} from './receiver.mjs';
import {ENGINE,HANDOFF,ZIP,SHELLS,sha256,createEnvelope,validateEnvelope,signObject,verifyObject,verifyReceipt} from './protocol.mjs';
let home, sender, receiver, listen;
const fixture=await readFile(new URL('./toroidal-fixture.json',import.meta.url));
const badname='<img src=x onerror=alert(1)>';
async function provision(){
  home=await mkdtemp(join(tmpdir(),'nullrider-v2-'));
  for(const who of ['sender','receiver']){
    const dir=join(home,who);await mkdir(dir);
    const pair=generateKeyPairSync('ed25519');
    await writeFile(join(dir,'private.pem'),pair.privateKey.export({type:'pkcs8',format:'pem'}));
    await writeFile(join(dir,'public.pem'),pair.publicKey.export({type:'spki',format:'pem'}));
    if(who==='sender')sender=pair;else receiver=pair;
  }
  listen=await makeReceiver({home,port:0});
}
await provision();
after(async()=>{await new Promise(resolve=>listen.server.close(resolve));await rm(home,{recursive:true,force:true});});
async function raw(envelope){const res=await fetch(listen.url+'/receive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(envelope)});return {status:res.status,body:await res.json()};}
function resign(envelope){const {signature,...body}=envelope;return {...body,signature:signObject(body,sender.privateKey)};}

test('sha256 known vector',()=>assert.equal(sha256(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('glyphs unchanged and zipper inverse',()=>{assert.equal(ENGINE,"{{ space cowboy v4 :: jit :: `'0'` sjm/|\\mjs }}");assert.equal(HANDOFF,"-'smj`0`mjs +'");assert.deepEqual(ZIP,[...SHELLS].reverse());});
test('intact toroidal observation signs, crosses once, persists and verifies',async()=>{
  const envelope=createEnvelope(fixture,'toroidal_observation.json',sender.privateKey);
  assert.equal(validateEnvelope(envelope,sender.publicKey).bytes.toString(),fixture.toString());
  const result=await raw(envelope);assert.equal(result.status,201);assert.equal(result.body.receipt.status,'ACCEPT');
  assert.equal(result.body.receipt.seam_crossings,1);assert.equal(result.body.receipt.rider_id,'i{sjm}');
  assert(verifyReceipt(result.body,envelope.manifest,receiver.publicKey));
  assert.equal((await readdir(join(home,'receiver','receipts'))).length,1);
  assert.deepEqual(JSON.parse(await readFile(join(home,'receiver','receipts',envelope.manifest.tx_id+'.json'),'utf8')),result.body);
  const second=await raw(envelope);assert.equal(second.status,409);assert.equal(second.body.reason,'REPLAY_REJECTED');
});
test('tampered bytes with unchanged signature cannot enter',async()=>{
 const e=createEnvelope(fixture,'byte-test',sender.privateKey);e.payload_b64=Buffer.from('changed').toString('base64');const r=await raw(e);assert.equal(r.status,400);assert.equal(r.body.reason,'BAD_SIGNATURE');
});
test('tampered bytes with valid sender signature still fail digest',async()=>{
 const e=createEnvelope(fixture,'byte-test',sender.privateKey);e.payload_b64=Buffer.from('changed').toString('base64');const r=await raw(resign(e));assert.equal(r.status,400);assert.equal(r.body.reason,'PAYLOAD_DIGEST_MISMATCH');
});
test('rider substitution is rejected even if re-signed',async()=>{
 const e=createEnvelope(fixture,'rider-test',sender.privateKey,{rider_id:'wrong rider'});const r=await raw(e);assert.equal(r.body.reason,'RIDER_MISMATCH');
});
test('shell reordering rejects validly signed manifest',async()=>{
 const e=createEnvelope(fixture,'shell-test',sender.privateKey,{zip_operations:[...SHELLS]});const r=await raw(e);assert.equal(r.body.reason,'ZIP_ORDER_MISMATCH');
});
test('two zero crossings are rejected',async()=>{
 const e=createEnvelope(fixture,'seam-test',sender.privateKey,{seam_events:['CROSS_0','CROSS_0']});const r=await raw(e);assert.equal(r.body.reason,'SEAM_CARDINALITY');
});
test('endpoint substitution rejects signed manifest',async()=>{
 const e=createEnvelope(fixture,'endpoint-test',sender.privateKey,{destination:'https://not-0root.example'});const r=await raw(e);assert.equal(r.body.reason,'ENDPOINT_MISMATCH');
});
test('the canonical and older signed glyphs cannot be swapped',async()=>{
 const e=createEnvelope(fixture,'glyph-test',sender.privateKey,{signed_handoff_literal:ENGINE});const r=await raw(e);assert.equal(r.body.reason,'GLYPH_MISMATCH');
});
test('unknown signer cannot transmit',async()=>{
 const attacker=generateKeyPairSync('ed25519');const e=createEnvelope(fixture,'attacker-test',attacker.privateKey);const r=await raw(e);assert.equal(r.body.reason,'BAD_SIGNATURE');
});
test('forged moon receipt does not verify at source',()=>{
 const e=createEnvelope(fixture,'receipt-test',sender.privateKey);
 const fake={receipt:{tx_id:e.manifest.tx_id,status:'ACCEPT'},signature:'aaaa'};
 assert.throws(()=>verifyReceipt(fake,e.manifest,receiver.publicKey),/BAD_RECEIPT_SIGNATURE/);
});
test('untrusted HTML-like artifact name is retained only as inert JSON',async()=>{
 const e=createEnvelope(fixture,badname,sender.privateKey);const r=await raw(e);assert.equal(r.status,201);assert.equal(r.body.receipt.artifact_name,badname);
 assert(!JSON.stringify(r.body).includes('<script>'));
});
test('missing content and excessive payload cannot be sealed',()=>{
 assert.throws(()=>createEnvelope(Buffer.alloc(0),'empty',sender.privateKey),/PAYLOAD_SIZE/);
 assert.throws(()=>createEnvelope(Buffer.alloc(65537),'huge',sender.privateKey),/PAYLOAD_SIZE/);
});
test('signature verification detects tampered receipt fields',()=>{
 const sample={message:'received',rider:'i{sjm}'};
 const signature=signObject(sample,receiver.privateKey);assert(verifyObject(sample,signature,receiver.publicKey));
 assert(!verifyObject({...sample,rider:'other'},signature,receiver.publicKey));
});
test('receipt from previous receiver instance survives a restart and prevents replay',async()=>{
 const e=createEnvelope(fixture,'restart-test',sender.privateKey);
 let r=await raw(e);assert.equal(r.status,201);
 await new Promise(resolve=>listen.server.close(resolve));
 listen=await makeReceiver({home,port:0});
 r=await raw(e);assert.equal(r.status,409);assert.equal(r.body.reason,'REPLAY_REJECTED');
});
