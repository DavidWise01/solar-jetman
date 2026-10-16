/* NULLRIDER — visual browser experiment engine; does not issue authenticated receiver receipts. */
export const BRANCHES = Object.freeze({
  A: Object.freeze({ angle: 0, widths: [16,8,4,4], shells: ['16','8','4','2×2'] }),
  B: Object.freeze({ angle: 180, widths: [8,4,4], shells: ['8','4','2×2'] })
});
export const SIGNS = ['−+','−−+','++−','−+−','+−+','+−'];
const te = new TextEncoder();
const td = new TextDecoder('utf-8',{fatal:true});
const bytesToBase64 = bytes => {
  let value=''; for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(value);
};
const base64ToBytes = s => {
  if(typeof s!=='string')throw Error('INVALID_BASE64');
  let raw;try{raw=atob(s);}catch{throw Error('INVALID_BASE64');}
  const b=Uint8Array.from(raw,c=>c.charCodeAt(0));
  if(bytesToBase64(b)!==s)throw Error('NONCANONICAL_BASE64');
  return b;
};
const canonical = value => JSON.stringify(value, (_k, v) => {
  if(v && !Array.isArray(v) && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]]));
  return v;
});
export function assert(ok,label){if(!ok)throw Error(label);}
export function equalBytes(a,b){return a.length===b.length && a.every((v,i)=>v===b[i]);}
export function rotate180([x,y]){return [-x,-y];}
function split(bytes,width){return Array.from({length:width},(_,i)=>bytesToBase64(Uint8Array.from(bytes.filter((_,j)=>j%width===i))));}
function gather(parts,width,total){
  assert(parts.length===width && Number.isSafeInteger(total) && total>=0 && total<=5000000,'BAD_SHARD_COUNT');
  const partsBytes=parts.map(base64ToBytes), cursors=Array(width).fill(0), result=new Uint8Array(total);
  for(let i=0;i<width;i++)assert(partsBytes[i].length===Math.floor(total/width)+(i<total%width?1:0),'BAD_SHARD_LENGTH');
  for(let i=0;i<total;i++){const which=i%width; result[i]=partsBytes[which][cursors[which]++];}
  return result;
}
export function packBranch(input,role){
  const spec=BRANCHES[role];assert(spec,'UNKNOWN_BRANCH');
  let current=new Uint8Array(input);
  if(spec.angle===180)current.reverse();
  for(let i=0;i<spec.widths.length;i++){
    const width=spec.widths[i];
    current=te.encode(canonical({stage:i,shell:spec.shells[i],width,length:current.length,lanes:split(current,width)}));
  }
  return bytesToBase64(current);
}
export function unpackBranch(packet,role){
  const spec=BRANCHES[role];assert(spec,'UNKNOWN_BRANCH');
  let current=base64ToBytes(packet);
  for(let i=spec.widths.length-1;i>=0;i--){
    let layer;try{layer=JSON.parse(td.decode(current));}catch{throw Error('BAD_SHELL_ENCODING');}
    assert(layer && layer.stage===i && layer.shell===spec.shells[i] && layer.width===spec.widths[i] && Array.isArray(layer.lanes),'SHELL_ORDER_MISMATCH');
    assert(Object.keys(layer).sort().join('|')==='lanes|length|shell|stage|width','BAD_SHELL_FIELDS');
    assert(equalBytes(te.encode(canonical(layer)),current),'NONCANONICAL_SHELL');
    current=gather(layer.lanes,spec.widths[i],layer.length);
  }
  if(spec.angle===180)current.reverse();
  return current;
}
export async function sha256(bytes){
  assert(globalThis.crypto?.subtle,'SECURE_CONTEXT_REQUIRED');
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function rendezvous(payload,{fault=false,txId}={}){
  assert(typeof payload==='string','PAYLOAD_REQUIRED');
  const original=te.encode(payload), altered=new Uint8Array(original);
  if(fault){if(altered.length)altered[0]^=1;else throw Error('CANNOT_MUTATE_EMPTY');}
  const packedA=packBranch(original,'A'), packedB=packBranch(altered,'B');
  const restoredA=unpackBranch(packedA,'A'), restoredB=unpackBranch(packedB,'B');
  const [sourceHash,aHash,bHash]=await Promise.all([sha256(original),sha256(restoredA),sha256(restoredB)]);
  const preservation=equalBytes(original,restoredA)&&equalBytes(original,restoredB)&&aHash===sourceHash&&bHash===sourceHash;
  return {
    record:{ protocol:'NULLRIDER-V3-VISUAL-SIM',tx_id:txId||crypto.randomUUID(),
      observed_at:new Date().toISOString(),source:'github.com/DavidWise01/solar-jetman',destination:'0root.ai (conceptual)',
      rider:'i{sjm}',source_sha256:sourceHash,solar_a_sha256:aHash,solar_b_sha256:bHash,
      solar_a_shells:[...BRANCHES.A.shells],solar_b_shells:[...BRANCHES.B.shells],solar_a_angle:0,solar_b_angle:180,
      seam_crossings:preservation?1:0,preservation,status:preservation?'ACCEPT':'REJECT',
      note:'Browser demonstration only; unsigned local visualization, not a hosted receiver attestation.' },
    packedA,packedB,restoredA,restoredB
  };
}
export const SAMPLE='{{ SOLAR A :: 0 :: SOLAR B :: GAP :: PRESERVATION }}\n{{ a(sian(m[ur[der]])) }}\n−+  −−+  ++−  −+−  +−+  +−';
