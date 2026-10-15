/* Generate fresh local development Ed25519 keypairs; no private key is committed. */
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const home=process.env.NR_HOME || new URL('./.local/',import.meta.url).pathname;
for (const name of ['sender','receiver']) {
  const path=join(home,name); await mkdir(path,{recursive:true,mode:0o700});
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  await writeFile(join(path,'public.pem'),publicKey.export({type:'spki',format:'pem'}),{flag:'wx',mode:0o644});
  await writeFile(join(path,'private.pem'),privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});
  console.log('Created',name,'keypair in',path);
}
console.log('Development keys only. Keep private.pem offline and untracked.');
