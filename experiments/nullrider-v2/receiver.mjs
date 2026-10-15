/* Separate destination process. Localhost-only by default; not a public production server. */
import http from 'node:http';
import { readFile, mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';
import { createPrivateKey,createPublicKey } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateEnvelope,createReceipt,MAX_PAYLOAD_BYTES } from './protocol.mjs';
const ROOT=fileURLToPath(new URL('./',import.meta.url));
export async function makeReceiver({home=join(ROOT,'.local'), host='127.0.0.1', port=8787}={}) {
  const senderPublic=createPublicKey(await readFile(join(home,'sender','public.pem')));
  const receiverPrivate=createPrivateKey(await readFile(join(home,'receiver','private.pem')));
  const receiptDir=join(home,'receiver','receipts'); await mkdir(receiptDir,{recursive:true,mode:0o700});
  let counter=0;
  const server=http.createServer(async (req,res)=>{
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    if(req.method==='GET'&&req.url==='/health') {res.end(JSON.stringify({ok:true,receiver:'NULLRIDER V2 LOCAL',mode:'development'}));return;}
    if(req.method!=='POST'||req.url!=='/receive') {res.writeHead(404);res.end(JSON.stringify({error:'NOT_FOUND'}));return;}
    let chunks=[],length=0;
    try {
      for await (const chunk of req) { length+=chunk.length; if(length>Math.ceil(MAX_PAYLOAD_BYTES*1.6)+16000) throw new Error('REQUEST_TOO_LARGE');chunks.push(chunk); }
      const obj=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const {manifest}=validateEnvelope(obj,senderPublic);
      const signed=createReceipt(manifest,receiverPrivate);
      // Durable, write-once receipt: O_EXCL ensures concurrent duplicate transmissions cannot be accepted.
      const destination=join(receiptDir,manifest.tx_id+'.json');
      let fh;
      try {fh=await open(destination,'wx',0o600);}catch(err){if(err.code==='EEXIST')throw new Error('REPLAY_REJECTED');throw err;}
      try {await fh.writeFile(JSON.stringify(signed,null,2)+'\n');await fh.sync();}finally{await fh.close();}
      counter++;res.writeHead(201);res.end(JSON.stringify(signed));
    } catch(err) {
      const reason=(err?.message||'INVALID_REQUEST');
      const status=reason==='REPLAY_REJECTED'?409:reason==='REQUEST_TOO_LARGE'?413:400;
      res.writeHead(status);res.end(JSON.stringify({status:'REJECT',reason}));
    }
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return {server,url:`http://${host}:${server.address().port}`,receiptDir,getAcceptedCount:()=>counter};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const listen=await makeReceiver({home:process.env.NR_HOME||join(ROOT,'.local'),port:Number(process.env.NR_PORT||8787)});
  console.log('NULLRIDER Moon receiver running:',listen.url,'— Ctrl+C to stop');
}
