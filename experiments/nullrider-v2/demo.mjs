/* One-command, builder-friendly local launch; both sides still run as distinct processes. */
import {access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const home=process.env.NR_HOME||join(root,'.local');
const port=process.env.NR_PORT||'18787';
const env={...process.env,NR_HOME:home,NR_PORT:String(port),NR_RECEIVER:`http://127.0.0.1:${port}`};
function launch(file){return spawn(process.execPath,[join(root,file)],{cwd:root,env,stdio:['ignore','pipe','pipe']});}
function finished(child){return new Promise((resolve,reject)=>{let out='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);child.once('error',reject);child.once('close',code=>code===0?resolve(out):reject(new Error(out||`exit ${code}`)));});}
try {await access(join(home,'sender','private.pem'));await access(join(home,'receiver','private.pem'));}
catch {console.log('Generating local development keys ...');console.log(await finished(launch('keys.mjs')));}
console.log('EARTH                   \u00b7 NULLRIDER V2 \u00b7                  MOON');
console.log("  smj  ---> [ { i{sjm} } ] ---> '0' ---> /|\\ ---> mjs");
console.log('         SHA-256 + Ed25519   -S+ SHARE   signed receipt\n');
const server=launch('receiver.mjs');
try {
  let ready=false;
  for(let i=0;i<80;i++) {
    try {const r=await fetch(env.NR_RECEIVER+'/health',{signal:AbortSignal.timeout(300)});if(r.ok){ready=true;break;}}catch{}
    await new Promise(r=>setTimeout(r,70));
  }
  if(!ready)throw new Error('Local Moon receiver failed to start');
  console.log(await finished(launch('sender.mjs')));
  console.log('Landing complete. See .local/receiver/receipts/ for persistent evidence.');
}finally {server.kill('SIGTERM');}
