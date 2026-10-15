/* Source process: sign one sealed metadata snapshot, send it, verify signed Moon receipt. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrivateKey,createPublicKey } from 'node:crypto';
import {createEnvelope,verifyReceipt} from './protocol.mjs';
const ROOT=fileURLToPath(new URL('./',import.meta.url));
export async function prepare(path,home) {
  const bytes=await readFile(path);
  const privateKey=createPrivateKey(await readFile(join(home,'sender','private.pem')));
  const receiverPublic=createPublicKey(await readFile(join(home,'receiver','public.pem')));
  return {envelope:createEnvelope(bytes,'Toroidal Fields — 2026-10-15 observed metadata',privateKey),receiverPublic};
}
export async function deliver(envelope,url,receiverPublic) {
  const res=await fetch(url+'/receive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(envelope),signal:AbortSignal.timeout(10000)});
  const result=await res.json();
  if(!res.ok)throw new Error(`Moon rejected (${res.status}): ${result.reason}`);
  verifyReceipt(result,envelope.manifest,receiverPublic);
  return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const home=process.env.NR_HOME||join(ROOT,'.local');
  const url=process.env.NR_RECEIVER||'http://127.0.0.1:8787';
  // Never send to arbitrary remote endpoints in demo mode.
  if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)){throw new Error('DEV_RECEIVER_MUST_BE_LOCALHOST');}
  const {envelope,receiverPublic}=await prepare(join(ROOT,'toroidal-fixture.json'),home);
  const receipt=await deliver(envelope,url,receiverPublic);
  console.log('MOON ACCEPT:',receipt.receipt.tx_id,'| rider',receipt.receipt.rider_id);
  console.log('SHA-256:',receipt.receipt.payload_sha256);
  console.log('Signed receipt verified; destination local file is create-once.');
}
