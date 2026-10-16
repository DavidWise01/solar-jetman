import {createMadrePrimeTower} from '../madre.mjs';
import {CATALOG,catalogSummary,readSolar184,NODE} from './solar.mjs';
// Additive facade: original Madre Prime source and operational controller unchanged.
export function createSolarMadre184(){
 const tower=createMadrePrimeTower();
 function through184(packet){
  if(!packet||packet.via!==NODE)return {accepted:false,error:'GATE_184_REQUIRED'};
  if(packet.op==='SOLAR_VIEW')return readSolar184(packet);
  if(packet.op==='SOLAR_CATALOG')return {accepted:true,readonly:true,via:NODE,catalog:CATALOG,summary:catalogSummary()};
  return tower.through184(packet);
 }
 return Object.freeze({through184});
}
