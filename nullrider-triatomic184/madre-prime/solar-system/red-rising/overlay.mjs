/* KET Madre Prime / Red Rising fiction lens on our Solar System.
 * Interpretation of Pierce Brown fictional setting and user's symbolic Fe/Au apex;
 * physics supplied by existing read-only solar engine. No claims of real societal genetics.
 */
import {createSolarMadre184} from '../bridge.mjs';
export const NODE=184;
export const BOOK='IRON GOLD';
export const AP_EXPLAIN='APEX PRIME is a user symbolic observer label; it is not a canon political title or a chemical species.';
export const METALS=Object.freeze({Fe:Object.freeze({number:26,name:'Iron',symbol:'Fe',kind:'chemical element'}),Au:Object.freeze({number:79,name:'Gold',symbol:'Au',kind:'chemical element'})});
export const CASTES=Object.freeze([
 {name:'Gold',role:'Ruling / political-military hierarchy',tier:'high',color:'#eac16b'},
 {name:'Silver',role:'Finance and commerce',tier:'high',color:'#c6cfdb'},
 {name:'White',role:'Religious / judicial offices',tier:'high',color:'#f1efea'},
 {name:'Copper',role:'Administration / bureaucracy',tier:'mid',color:'#ba866c'},
 {name:'Blue',role:'Pilots and navigators',tier:'mid',color:'#64a9f0'},
 {name:'Yellow',role:'Doctors and scientists',tier:'mid',color:'#edc45b'},
 {name:'Green',role:'Programmers and analysts',tier:'mid',color:'#73c69e'},
 {name:'Violet',role:'Artisans and carvers',tier:'mid',color:'#b59ae9'},
 {name:'Orange',role:'Engineers and mechanics',tier:'mid',color:'#e8a063'},
 {name:'Gray',role:'Soldiers and law enforcement',tier:'low',color:'#9ca8ba'},
 {name:'Brown',role:'Domestic and service labor',tier:'low',color:'#af8b70'},
 {name:'Obsidian',role:'Warriors',tier:'low',color:'#767a8e'},
 {name:'Pink',role:'Compulsory intimate/pleasure service',tier:'low',color:'#ec9fb8'},
 {name:'Red',role:'Mining and manual labor',tier:'low',color:'#d55d65'}
].map(x=>Object.freeze(x)));
// Fiction snapshot selected near the start of Iron Gold ~753 PCE, not a precise planetary map.
// Mercury is contested and changes hands during book 4, not unambiguously fixed ownership.
export const WORLDS=Object.freeze([
 {id:'mercury',name:'Mercury',faction:'CONTESTED',context:'Iron Rain and changing control; inner-system battlefront',lore:'Iron Gold'},
 {id:'venus',name:'Venus',faction:'SOCIETY REMNANT',context:'Stronghold of the Ash Lord and remaining Society Gold power',lore:'Iron Gold'},
 {id:'earth',name:'Earth',faction:'SOLAR REPUBLIC',context:'Core sphere claimed by the Republic in the Solar War',lore:'Iron Gold'},
 {id:'mars',name:'Mars',faction:'SOLAR REPUBLIC',context:'Origin of Darrow the Red miner; site of Rising and Republic control',lore:'Red Rising / Iron Gold'},
 {id:'jupiter',name:'Jupiter',faction:'RIM DOMINION',context:'Outer-system Rim and its influential moons',lore:'Iron Gold'},
 {id:'saturn',name:'Saturn',faction:'RIM DOMINION',context:'Rim sphere including inhabited moons',lore:'Iron Gold'},
 {id:'uranus',name:'Uranus',faction:'NOT ASSIGNED',context:'Physical planet retained; no asserted faction in this selected snapshot',lore:'Unmapped'},
 {id:'neptune',name:'Neptune',faction:'NOT ASSIGNED',context:'Physical planet retained; no asserted faction in this selected snapshot',lore:'Unmapped'},
 {id:'luna',name:'Luna (Earth moon)',faction:'SOLAR REPUBLIC',context:'Seat of Republic government following the fall of Society rule on Luna',lore:'Iron Gold'},
 {id:'phobos',name:'Phobos (Mars moon)',faction:'SOLAR REPUBLIC',context:'Orbital shipyards and Mars defense; world-affiliation snapshot',lore:'Iron Gold'},
 {id:'ganymede',name:'Ganymede (Jupiter moon)',faction:'RIM DOMINION',context:'Major Jupiter moon with strategic historical importance',lore:'Iron Gold'},
 {id:'titan',name:'Titan (Saturn moon)',faction:'RIM DOMINION',context:'Saturn moon in the Rim sphere',lore:'Iron Gold'}
].map(x=>Object.freeze(x)));
export const SPHERES=Object.freeze(['MERCURY','VENUS','EARTH','MARS','JUPITER','SATURN','URANUS','NEPTUNE']);
export const FICTION_SOURCES=Object.freeze([
 'https://www.penguinrandomhouse.com/books/221552/red-rising-by-pierce-brown/',
 'https://www.penguinrandomhouse.com/books/545685/iron-gold-by-pierce-brown/',
 'https://red-rising.fandom.com/wiki/The_Society',
 'https://red-rising.fandom.com/wiki/The_Conquering',
 'https://red-rising.fandom.com/wiki/Gold'
]);
const readonlyOps=new Set(['VIEW','AUDIT','LOCATE','CELL_ADDRESS','SOLAR_VIEW','SOLAR_CATALOG']);
export function createRedRising184(){
 const solar=createSolarMadre184();
 const byId=new Map(WORLDS.map(p=>[p.id,p]));
 return Object.freeze({through184(req){
  if(!req||req.via!==NODE)return {accepted:false,error:'NODE_184_REQUIRED'};
  if(req.op==='RR_CATALOG')return {accepted:true,readonly:true,via:NODE,castes:CASTES,worlds:WORLDS,metals:METALS,fictionSources:FICTION_SOURCES,apex:AP_EXPLAIN};
  if(req.op==='RR_VIEW'){
   if(!byId.has(req.planet))return {accepted:false,error:'UNKNOWN_LORE_WORLD'};
   // The selected fiction planet NEVER changes physical solar calculations implicitly.
   // Physics is an explicitly Earth-analog toy sample at user-selected distance.
   const physical=solar.through184({via:NODE,op:'SOLAR_VIEW',phase:req.phase??0,distanceAu:req.distanceAu??1,
    depthMeters:req.depthMeters??1,waterAttenuation:req.waterAttenuation??0.2,
    lightTransmission:req.lightTransmission??0.75,uvbTransmission:req.uvbTransmission??0.1,
    material:req.material??5832,mature:req.mature??8,nitrogen:req.nutrients??1,
    phosphorus:req.nutrients??1,silica:req.nutrients??1,iron:req.nutrients??1,carbon:req.nutrients??1});
   if(!physical.accepted)return physical;
   return {accepted:true,readonly:true,via:NODE,book:BOOK,world:byId.get(req.planet),
    apex:{name:'APEX PRIME',interpretation:'Symbolic overlay / not a canon designation',iron:METALS.Fe,gold:METALS.Au,
     novel:'Gold is the dominant caste; Iron Gold is a historical martial ideal, not Fe+Au fusion or a higher atomic state'},
    solar:physical.solar,diatom:physical.diatom,torre:physical.torre,settings:{phase:physical.phase},
    limits:['World is a fictional political label and does not determine Earth-analog radiation.','Iron Gold refers to an elite ideal in fiction, not an element or physical rank.','Symbolic apex is not a claim that one human group is biologically superior.','No core cells or physical state are mutated.']};
  }
  if(readonlyOps.has(req.op))return solar.through184(req);
  return {accepted:false,error:'READ_ONLY_FICTION_OBSERVER'};
 }});
}
