/* NULLRIDER CRUISE: symbolic geometry and state, not a physical scale model. */
export const ENGINE = Object.freeze([
  Object.freeze({temporal:-1,label:'PAST',engine:'TACH',value:-2,side:'A'}),
  Object.freeze({temporal:0,label:'PRESENT',engine:'GYRO',value:0,side:'0'}),
  Object.freeze({temporal:1,label:'FUTURE',engine:'POSI',value:3,side:'B'})
]);
export const ROLL = Object.freeze([5,3,1]);
export const MOATS = Object.freeze([9,7,5,3,1]);
export const LANE_COUNT = 8;
export const GRID = Object.freeze({heads:12,rows:29,cols:47,total:16356});
export const SIGNS = Object.freeze(['−+','−−+','++−','−+−','+−+','+−']);
export const SCALAR_RANGE=104;
export const SHELL_ADDRESSES=208;
export function normalizeDegree(deg){return ((deg%360)+360)%360;}
export function shellPair(n){
  if(!Number.isInteger(n)||n<0||n>SCALAR_RANGE)throw Error('SHELL_OUT_OF_RANGE');
  const a=normalizeDegree(n*10),b=normalizeDegree(-n*10);
  return Object.freeze({scalar:0,n,positive:`10^+${n}`,negative:`10^-${n}`,aDegrees:a,bDegrees:b,mirrorInvariant:normalizeDegree(a+b)===0,addresses:SHELL_ADDRESSES});
}
export function selectTemporal(t){const found=ENGINE.find(x=>x.temporal===t);if(!found)throw Error('UNKNOWN_TEMPORAL');return found;}
export function laneSample(source,head=0){
  // Eight concurrent named surfaces. The 5 labels beyond the observed three
  // are kept as unassigned slots, rather than invented social roles.
  if(!Number.isInteger(head)||head<0||head>=GRID.heads)throw Error('BAD_HEAD');
  const bytes=new TextEncoder().encode(source);const counts=Array(LANE_COUNT).fill(0);
  bytes.forEach((b,i)=>{counts[i%LANE_COUNT]=(counts[i%LANE_COUNT]+b+head)%65536;});
  return counts;
}
export function receiptOverlay({temporal=0,shell=31,head=0,speed=1}={}){
  const t=selectTemporal(temporal),s=shellPair(shell);
  if(!Number.isInteger(head)||head<0||head>=GRID.heads)throw Error('BAD_HEAD');
  if(typeof speed!=='number'||!Number.isFinite(speed)||speed<0.25||speed>3)throw Error('BAD_SPEED');
  return Object.freeze({frame:'KET-SCALAR-0-SYMBOLIC',temporal:t.temporal,time_state:t.label,engine:t.engine,engine_coordinate:t.value,scalar:0,shell_index:s.n,shell_a_degrees:s.aDegrees,shell_b_degrees:s.bDegrees,registry_addresses:SHELL_ADDRESSES,solar_a_angle:0,solar_b_angle:180,head,grid:{...GRID},roll:[...ROLL],fortress:[...MOATS],concurrent_lanes:LANE_COUNT,speed});
}
export function verifyOverlay(o){
  if(!o||o.frame!=='KET-SCALAR-0-SYMBOLIC'||o.scalar!==0||o.registry_addresses!==SHELL_ADDRESSES||o.solar_a_angle!==0||o.solar_b_angle!==180||o.concurrent_lanes!==8)return false;
  if(JSON.stringify(o.roll)!==JSON.stringify(ROLL)||JSON.stringify(o.fortress)!==JSON.stringify(MOATS))return false;
  if(JSON.stringify(o.grid)!==JSON.stringify(GRID))return false;
  try{const canonical=receiptOverlay({temporal:o.temporal,shell:o.shell_index,head:o.head,speed:o.speed});return JSON.stringify(canonical)===JSON.stringify(o);}catch{return false;}
}
