/* NULLRIDER Node184 observer: read-only Bayesian inference under declared sensor assumptions.
 * No access to private cell state, labels, mutation APIs, learned weights, or external data.
 * Posterior scores are meaningful ONLY if the assumed signal likelihoods are accurate.
 */
export const INFER_NODE = 184;
export const CELL_COUNT = 365;
export const SENSOR_MODEL = Object.freeze({
  alarm: Object.freeze({sensitivity:0.82,falsePositiveRate:0.09}),
  drift: Object.freeze({sensitivity:0.70,falsePositiveRate:0.20}),
});
const BANDS = new Set(['TACH','GYRO','POSI','RESERVE']);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export function prior184(age,band){
  return clamp(0.07 + 0.16*clamp(age,0,50)/50 + (band==='RESERVE'?0.025:0),0.02,0.35);
}
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function validateObservation(o){
  if(!o||typeof o!=='object'||Array.isArray(o))return 'BAD_OBSERVATION';
  const keys=['id','band','age','alarm','drift'];
  if(Object.keys(o).some(k=>!keys.includes(k)))return 'UNEXPECTED_FIELD_OR_LABEL_LEAK';
  if(!Number.isInteger(o.id)||o.id<1||o.id>CELL_COUNT)return 'INVALID_CELL_ID';
  if(!BANDS.has(o.band))return 'INVALID_BAND';
  if(!Number.isInteger(o.age)||o.age<0||o.age>50)return 'INVALID_AGE';
  if(!own(o,'alarm')||!own(o,'drift'))return 'MISSING_SENSOR_FIELDS';
  if(![true,false,null].includes(o.alarm)||![true,false,null].includes(o.drift))return 'INVALID_SENSOR';
  return null;
}
function predict(o,high,low){
  const prior=prior184(o.age,o.band);
  const sensors=['alarm','drift'].filter(k=>o[k]!==null);
  if(!sensors.length)return {id:o.id,band:o.band,age:o.age,alarm:o.alarm,drift:o.drift,posterior:null,decision:'ABSTAIN',reason:'NO_EVIDENCE'};
  let odds=prior/(1-prior);
  for(const key of sensors){const m=SENSOR_MODEL[key];odds*=o[key]?m.sensitivity/m.falsePositiveRate:(1-m.sensitivity)/(1-m.falsePositiveRate);}
  const posterior=odds/(1+odds);
  const decision=posterior>=high?'ALERT':posterior<=low?'CLEAR':'ABSTAIN';
  return {id:o.id,band:o.band,age:o.age,alarm:o.alarm,drift:o.drift,
    posterior:Number(posterior.toFixed(8)),decision,reason:decision==='ABSTAIN'?'INSUFFICIENT_CONFIDENCE':'MODEL_THRESHOLD',sensors:sensors.length};
}
export function infer184(packet){
  if(!packet||packet.via!==INFER_NODE)return {accepted:false,error:'WRONG_GATE_EXPECTED_184'};
  if(packet.op!=='INFER')return {accepted:false,error:'INFERENCE_READ_ONLY'};
  if(!Array.isArray(packet.observations)||packet.observations.length<1||packet.observations.length>CELL_COUNT)
    return {accepted:false,error:'INVALID_OBSERVATION_SET'};
  const high=packet.high??0.8,low=packet.low??0.08;
  if(typeof high!=='number'||typeof low!=='number'||!Number.isFinite(high)||!Number.isFinite(low)||low<0||high>1||low>=high)return {accepted:false,error:'BAD_THRESHOLDS'};
  const ids=new Set();
  for(const obs of packet.observations){
    const problem=validateObservation(obs);
    if(problem)return {accepted:false,error:problem};
    if(ids.has(obs.id))return {accepted:false,error:'DUPLICATE_CELL_ID'};
    ids.add(obs.id);
  }
  const rows=packet.observations.map(o=>predict(o,high,low));
  const counts={ALERT:0,CLEAR:0,ABSTAIN:0};for(const r of rows)counts[r.decision]++;
  return {accepted:true,node:INFER_NODE,op:'INFER',readonly:true,model:'BAYES_INDEPENDENT_SYNTHETIC_SENSORS_V1',
    thresholds:{high,low},count:rows.length,counts,rows};
}
