/* NULLRIDER TRIATOMIC 184 — symbolic homeostasis, no physical chemistry claims.
 * The closure exports one entry point. All observations and mutations use gate 184.
 * 3 x 118 address slots + 11 shared reserve = 365 positions.
 */
export const NODE = 184;
export const COUNT = 365;
export const BANDS = Object.freeze([
  Object.freeze({name:'TACH',time:-1,engine:-2,count:118}),
  Object.freeze({name:'GYRO',time:0,engine:0,count:118}),
  Object.freeze({name:'POSI',time:1,engine:3,count:118}),
  Object.freeze({name:'RESERVE',time:0,engine:0,count:11}),
]);
const copy = value => JSON.parse(JSON.stringify(value));
function fingerprint(cells) {
  // Noncryptographic change indicator; never an authenticity signature.
  let n=2166136261;
  for(const c of cells){
    for(const ch of `${c.id}:${c.version}:${c.age}:${c.health.toFixed(2)}:${+c.fault}|`){n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;}
  }
  return n.toString(16).padStart(8,'0');
}
export function createTriatomic184() {
  const cells=[];
  for (let b=0;b<BANDS.length;b++) for(let slot=0;slot<BANDS[b].count;slot++) {
    const id=cells.length+1;
    const age=slot%17;
    cells.push({id,band:BANDS[b].name,slot:slot+1,version:0,age,health:Number((99.5-age*.15).toFixed(2)),fault:false});
  }
  if(cells.length!==COUNT)throw Error('REGISTRY_MISMATCH');
  let cycle=0, remainderTenths=0, retiredTotal=0, serial=0;
  const seen=new Set(), ledger=[];
  function status(){
    const faulty=cells.filter(c=>c.fault).length;
    const low=cells.filter(c=>c.health<85&&!c.fault).length;
    return {node:NODE,cycle,occupied:cells.length,capacity:COUNT,fullness:100,
      triatomic:[118,118,118],reserve:11,temporal:[-1,0,1],engine:[-2,0,3],
      faults:faulty,lowHealth:low,healthy:COUNT-faulty-low,
      retiredTotal,renewedTotal:retiredTotal,quotaRemainderTenths:remainderTenths,
      verdict:faulty===0&&low===0&&cells.length===COUNT?'STABLE':'SERVICE_REQUIRED',
      fingerprint:fingerprint(cells),last:ledger.length?copy(ledger.at(-1)):null,
      logSize:ledger.length};
  }
  function record(type,tx,details){
    const rec={node:NODE,serial:++serial,cycle,type,tx,details:copy(details),fingerprint:fingerprint(cells)};
    ledger.push(rec);
    return rec;
  }
  function runCycle(tx) {
    cycle++;
    // Fractional carry: exactly 73 retirements in 10 cycles (7.3 average).
    let quota=7;
    remainderTenths+=3;
    if(remainderTenths>=10){quota++;remainderTenths-=10;}
    for(const cell of cells){cell.age++;cell.health=Math.max(0,Number((cell.health-.15).toFixed(2)));}
    const risk = c => (c.fault?1e6:0)+(100-c.health)*100+c.age*.01;
    // Ensure all three concurrent branches can renew; no one branch owns the gate.
    const selected=[];
    for(const b of ['TACH','GYRO','POSI']){
      const best=cells.filter(c=>c.band===b).sort((a,z)=>risk(z)-risk(a)||a.id-z.id)[0];
      selected.push(best);
    }
    const chosen=new Set(selected.map(c=>c.id));
    const others=cells.filter(c=>!chosen.has(c.id)).sort((a,z)=>risk(z)-risk(a)||a.id-z.id);
    selected.push(...others.slice(0,quota-selected.length));
    const retired=selected.map(c=>({id:c.id,band:c.band,version:c.version,health:c.health,fault:c.fault}));
    for(const c of selected){c.version++;c.age=0;c.health=100;c.fault=false;}
    retiredTotal+=quota;
    const evt=record('RENEW',tx,{quota,retired,created:retired.map(c=>({id:c.id,version:c.version+1})),replaced:quota,
       retained:COUNT-quota,occupied:COUNT,percentage:quota/COUNT*100});
    return {event:evt,stats:status()};
  }
  function through184(packet){
    if(!packet||packet.via!==NODE)return {accepted:false,error:'WRONG_GATE_EXPECTED_184'};
    const {op,tx}=packet;
    if(op==='VIEW')return {accepted:true,snapshot:{...status(),cells:copy(cells),ledger:copy(ledger)}};
    if(typeof tx!=='string'||!tx.trim())return {accepted:false,error:'TX_REQUIRED'};
    if(seen.has(tx))return {accepted:false,error:'REPLAY_BLOCKED',stats:status()};
    if(op!=='RENEW'&&op!=='FAULT'&&op!=='RESEED')return {accepted:false,error:'UNKNOWN_OPERATION'};
    if(op==='FAULT'&&(!Number.isInteger(packet.cell)||packet.cell<1||packet.cell>COUNT))
      return {accepted:false,error:'INVALID_CELL_ID'};
    seen.add(tx);
    if(op==='RENEW')return {accepted:true,...runCycle(tx)};
    if(op==='FAULT'){
      const cell=cells[packet.cell-1];cell.fault=true;cell.health=0;
      const event=record('FAULT',tx,{id:cell.id,band:cell.band});
      return {accepted:true,event,stats:status()};
    }
    // Reseeding, if wanted, still records a transition; the receipt ledger is never erased.
    for(const c of cells){c.version++;c.age=0;c.health=100;c.fault=false;}
    cycle=0;remainderTenths=0;
    const event=record('RESEED',tx,{preservedCapacity:COUNT});
    return {accepted:true,event,stats:status()};
  }
  return Object.freeze({through184});
}
