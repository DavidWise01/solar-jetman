/* Node.js-only add-on: route the existing calibrated adaptive phase observer
 * through the SAME logical Node 184 interface as the static Madre tower.
 * Browser dashboard deliberately does not import node:crypto or synthetic truth.
 */
import {createMadrePrimeTower} from './madre.mjs';
import {calibrate184,inferAdaptive184} from '../adaptive/adaptive.mjs';
export function createMadrePrimeAdaptiveNode(){
 const tower=createMadrePrimeTower();let policy=null;
 function through184(packet){
  if(!packet||packet.via!==184)return {accepted:false,error:'GATE_184_REQUIRED'};
  if(packet.op==='CALIBRATE_ADAPTIVE'){
   const r=calibrate184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:packet.referenceWorlds,margin:packet.margin});
   if(r.accepted)policy=r.policy;
   return r;
  }
  if(packet.op==='INFER_ADAPTIVE'){
   if(!policy)return {accepted:false,error:'CALIBRATION_REQUIRED'};
   return inferAdaptive184({via:184,op:'INFER_ADAPTIVE',observations:packet.observations,policy});
  }
  return tower.through184(packet);
 }
 return Object.freeze({through184});
}
