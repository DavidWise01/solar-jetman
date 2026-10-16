/* NULLRIDER 184 — phase-pair inference experiment.
 * Hypothetical statistical sensor model, NOT quantum/atomic measurements.
 * Read-only: no renewal writes; the 365-cell Node 184 core remains unchanged.
 */
import {infer184, prior184} from '../infer/infer.mjs';
export const GATE=184, APERTURE_DEG=7.5, CELL_COUNT=365;
const FIELDS=new Set(['id','band','age','alarm','drift','phase']);
const signedDiff=(a,b)=>((a-b+540)%360)-180;
export function phaseState184(phase){
  if(typeof phase!=='number'||!Number.isFinite(phase))throw new Error('INVALID_PHASE');
  const inner=((phase%360)+360)%360,outer=(((-phase)%360)+360)%360;
  const relative=signedDiff(inner,outer);
  return {innerDeg:inner,outerDeg:outer,relativeDeg:relative,aligned:Math.abs(relative)<=APERTURE_DEG+1e-10};
}
function validate(o){
  if(!o||typeof o!=='object'||Array.isArray(o))return 'INVALID_OBSERVATION';
  for(const k of Object.keys(o))if(!FIELDS.has(k))return 'UNEXPECTED_FIELD_OR_TRUTH_LEAK';
  if(!Array.isArray(o.phase)||o.phase.length!==2)return 'TWO_PHASE_SAMPLES_REQUIRED';
  for(const s of o.phase){
    if(!s||typeof s!=='object'||Object.keys(s).some(k=>!['angle','value'].includes(k)))return 'BAD_PHASE_SAMPLE';
    if(typeof s.value!=='number'||!Number.isFinite(s.value))return 'BAD_PHASE_VALUE';
    try{if(!phaseState184(s.angle).aligned)return 'PHASE_GATE_CLOSED';}catch{return 'BAD_PHASE_ANGLE';}
  }
  return null;
}
function llr2(x0,x1,mu0,mu1,sigmaBackground,sigmaNoise){
  const b2=sigmaBackground*sigmaBackground,n2=sigmaNoise*sigmaNoise,v=b2+n2,c=b2;
  const det=v*v-c*c;
  const w0=(v*mu0-c*mu1)/det,w1=(v*mu1-c*mu0)/det;
  return w0*(x0-mu0/2)+w1*(x1-mu1/2);
}
const logistic=x=>x>40?1:x< -40?0:1/(1+Math.exp(-x));
export function inferPhase184({via,op,mode,observations,amplitude=0.6,sigmaBackground=1.1,sigmaNoise=0.6}){
  if(via!==GATE)return {accepted:false,error:'WRONG_GATE_EXPECTED_184'};
  if(op!=='INFER_PHASE')return {accepted:false,error:'READ_ONLY_INFERENCE'};
  if(!['STATIONARY','COUNTER_ROTATING'].includes(mode))return {accepted:false,error:'BAD_MODE'};
  if(!Array.isArray(observations)||!observations.length||observations.length>CELL_COUNT)return {accepted:false,error:'BAD_OBSERVATIONS'};
  if([amplitude,sigmaBackground,sigmaNoise].some(x=>!Number.isFinite(x))||amplitude<0||sigmaBackground<0||sigmaNoise<=0)return {accepted:false,error:'INVALID_MODEL'};
  const seen=new Set();
  for(const o of observations){
    const fail=validate(o);if(fail)return {accepted:false,error:fail};
    if(seen.has(o.id))return {accepted:false,error:'DUPLICATE_ID'};seen.add(o.id);
    if(mode==='STATIONARY' && o.phase.some(s=>Math.abs(signedDiff(s.angle,0))>1e-7))return {accepted:false,error:'INVALID_STATIONARY_PHASE'};
    if(mode==='COUNTER_ROTATING' && (Math.abs(signedDiff(o.phase[0].angle,0))>1e-7||Math.abs(signedDiff(o.phase[1].angle,180))>1e-7))return {accepted:false,error:'INVALID_ROTATING_PHASE'};
  }
  const baseline=infer184({via:184,op:'INFER',observations:observations.map(({phase,...rest})=>rest)});
  if(!baseline.accepted)return baseline;
  const rows=baseline.rows.map((b,i)=>{
    const o=observations[i],prior=b.posterior??prior184(o.age,o.band);
    const bounded=Math.min(1-1e-12,Math.max(1e-12,prior));
    const lr=llr2(o.phase[0].value,o.phase[1].value,amplitude,mode==='STATIONARY'?amplitude:-amplitude,sigmaBackground,sigmaNoise);
    const posterior=logistic(Math.log(bounded/(1-bounded))+lr);
    return {id:b.id,band:b.band,age:b.age,phase0:o.phase[0].angle,phase1:o.phase[1].angle,
      basePosterior:prior,posterior,mode,phaseLikelihoodRatio:lr,
      decision:posterior>=.8?'ALERT':posterior<=.08?'CLEAR':'ABSTAIN'};
  });
  return {accepted:true,readonly:true,via:184,mode,node:184,count:rows.length,rows,apertureDeg:APERTURE_DEG,
    model:'HYPOTHETICAL_PHASE_SENSOR_V1',note:'Statistical assumption: faults shift opposed phase samples; not measured hardware behavior.'};
}
