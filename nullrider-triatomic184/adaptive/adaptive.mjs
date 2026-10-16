/* NULLRIDER Node184 ADAPTIVE PHASE OBSERVER — experimental V2.
   All observation access is via logical Node 184. Inference never writes to cells.
   Expert selection uses independent, labeled calibration worlds ONLY; held-out
   labels must never appear in observation packets. No real sensor data supplied.
*/
import {createHash} from 'node:crypto';
import {inferPhase184} from '../phase/phase.mjs';
export const GATE=184;
export const EXPERTS=Object.freeze(['BASELINE','PHASE_INVARIANT','PHASE_OPPOSED']);
// Process-local issuance registry: policies cannot be forged by JSON alone.
// A production cross-process version would need signed, versioned policies.
const issuedPolicies=new WeakSet();
const MODEL={amplitude:0.6,sigmaBackground:1.1,sigmaNoise:0.6};
const sigmoid=x=>x>40?1:x< -40?0:1/(1+Math.exp(-x));
const logit=x=>Math.log(Math.max(1e-12,Math.min(1-1e-12,x))/Math.max(1e-12,1-Math.min(1-1e-12,x)));
function llr(x0,x1,amp0,amp1){
  const v=MODEL.sigmaBackground**2+MODEL.sigmaNoise**2,c=MODEL.sigmaBackground**2,det=v*v-c*c;
  const w0=(v*amp0-c*amp1)/det,w1=(v*amp1-c*amp0)/det;
  return w0*(x0-amp0/2)+w1*(x1-amp1/2);
}
// Exactly two approved samples at 0/180, and no fault-truth field.
export function scorePacket184({via,op,observations}){
  if(via!==GATE)return {accepted:false,error:'WRONG_GATE_EXPECTED_184'};
  if(op!=='INFER_ADAPTIVE'&&op!=='CALIBRATE_ADAPTIVE')return {accepted:false,error:'READ_ONLY_GATE'};
  const valid=inferPhase184({via:GATE,op:'INFER_PHASE',mode:'COUNTER_ROTATING',observations,amplitude:0});
  if(!valid.accepted)return valid;
  const rows=valid.rows.map((b,i)=>{
    const {value:x0}=observations[i].phase[0],{value:x1}=observations[i].phase[1];
    const base=b.basePosterior;
    const p=logit(base);
    return {id:b.id,band:b.band,base,probs:{
      BASELINE:base,
      PHASE_INVARIANT:sigmoid(p+llr(x0,x1,MODEL.amplitude,MODEL.amplitude)),
      PHASE_OPPOSED:sigmoid(p+llr(x0,x1,MODEL.amplitude,-MODEL.amplitude))
    }};
  });
  return {accepted:true,readonly:true,node:GATE,count:rows.length,rows};
}
function ciLower(d){
  if(d.length<2)return -Infinity;
  const avg=d.reduce((a,b)=>a+b,0)/d.length;
  const sd=Math.sqrt(d.reduce((a,b)=>a+(b-avg)**2,0)/(d.length-1));
  return avg-1.96*sd/Math.sqrt(d.length);
}
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const scoreWorld=(packet,truth)=>{
  const sums=Object.fromEntries(EXPERTS.map(k=>[k,0]));
  for(const row of packet.rows){
    const y=truth.get(row.id)?1:0;
    for(const k of EXPERTS)sums[k]+=(row.probs[k]-y)**2;
  }
  return Object.fromEntries(EXPERTS.map(k=>[k,sums[k]/packet.rows.length]));
};
export function calibrate184({via,op,referenceWorlds,margin=0.001}){
  if(via!==GATE)return {accepted:false,error:'WRONG_GATE_EXPECTED_184'};
  if(op!=='CALIBRATE_ADAPTIVE')return {accepted:false,error:'READ_ONLY_GATE'};
  if(!Array.isArray(referenceWorlds)||referenceWorlds.length<12||referenceWorlds.length>250)return {accepted:false,error:'INSUFFICIENT_CALIBRATION_WORLDS'};
  if(typeof margin!=='number'||!Number.isFinite(margin)||margin<0||margin>.1)return {accepted:false,error:'BAD_MARGIN'};
  const worlds=[];const uniqueSeeds=new Set();
  for(const ref of referenceWorlds){
    if(!ref||!Number.isInteger(ref.seed)||uniqueSeeds.has(ref.seed))return {accepted:false,error:'BAD_OR_REPEATED_CALIBRATION_SEED'};
    uniqueSeeds.add(ref.seed);
    if(!(ref.truth instanceof Map)||ref.truth.size!==365)return {accepted:false,error:'CALIBRATION_REQUIRES_KNOWN_REFERENCE_LABELS'};
    const packet=scorePacket184({via,op,observations:ref.rotating});
    if(!packet.accepted)return packet;
    worlds.push(scoreWorld(packet,ref.truth));
  }
  const brier=Object.fromEntries(EXPERTS.map(k=>[k,mean(worlds.map(w=>w[k]))]));
  // Only enable a speculative expert if it beats the no-phase baseline on
  // independent reference worlds with positive mean margin and CI lower bound.
  const candidates=EXPERTS.slice(1).filter(k=>ciLower(worlds.map(w=>w.BASELINE-w[k]))>margin);
  candidates.sort((a,b)=>brier[a]-brier[b]);
  let selected=candidates[0]??'BASELINE';
  // Further safety: opposed phase must also beat the invariant-phase expert.
  if(selected==='PHASE_OPPOSED'&&ciLower(worlds.map(w=>w.PHASE_INVARIANT-w.PHASE_OPPOSED))<=margin){
    selected=candidates.includes('PHASE_INVARIANT')?'PHASE_INVARIANT':'BASELINE';
  }
  const policy={version:'NODE184_PHASE_ADAPTIVE_V2',selected,referenceWorlds:worlds.length,
    referenceDigest:createHash('sha256').update(JSON.stringify([...uniqueSeeds])).digest('hex'),
    calibrationBrier:brier,minimumMargin:margin,confidenceRule:'NORMAL_95_CI_LOWER_ABOVE_MARGIN',
    realSensorValidated:false};
  Object.freeze(policy.calibrationBrier);Object.freeze(policy);issuedPolicies.add(policy);
  return {accepted:true,readonly:true,node:GATE,policy};
}
export function inferAdaptive184({via,op,observations,policy}){
  if(via!==GATE)return {accepted:false,error:'WRONG_GATE_EXPECTED_184'};
  if(op!=='INFER_ADAPTIVE')return {accepted:false,error:'READ_ONLY_GATE'};
  if(!policy||policy.version!=='NODE184_PHASE_ADAPTIVE_V2'||!EXPERTS.includes(policy.selected)||policy.realSensorValidated!==false||!issuedPolicies.has(policy))return {accepted:false,error:'UNTRUSTED_OR_MISSING_POLICY'};
  const p=scorePacket184({via,op,observations});if(!p.accepted)return p;
  const selected=policy.selected;
  const rows=p.rows.map(r=>({id:r.id,band:r.band,basePosterior:r.base,
    posterior:r.probs[selected],decision: r.probs[selected]>=.8?'ALERT':r.probs[selected]<=.08?'CLEAR':'ABSTAIN'}));
  return {accepted:true,readonly:true,node:GATE,op,model:selected,
    note:'Model selected on labeled calibration worlds; not validated against real sensors.',rows};
}
export function selectQuota184(rows,k){
  if(!Number.isInteger(k)||k<3||k>365)throw Error('BAD_QUOTA');
  const sorted=a=>[...a].sort((a,b)=>b.posterior-a.posterior||a.id-b.id);
  const picks=[],ids=new Set();
  for(const band of ['TACH','GYRO','POSI']){
    const x=sorted(rows.filter(r=>r.band===band))[0];if(!x)throw Error('MISSING_PRIMARY_BAND');
    picks.push(x);ids.add(x.id);
  }
  picks.push(...sorted(rows.filter(r=>!ids.has(r.id))).slice(0,k-3));
  return picks;
}
export const calibrationDiagnostics184=({via,referenceWorlds})=>{
 const x=calibrate184({via,op:'CALIBRATE_ADAPTIVE',referenceWorlds});return x;
};
