// SEEDED CROSS VOLUME v1 — deterministic projection from the 12 values displayed
// in SEEDED_CROSS_GRID_16356.html. Not measured per-cell attention.
export const GRID = Object.freeze({heads:12,rows:29,cols:47,total:16356});
export const HEADS = Object.freeze([
 ['sat',0.19,'sat',0.25],['tired',0.99,'tired',1.00],['The',0.27,'The',0.25],['tired',1.00,'tired',1.00],
 ['tired',0.64,'tired',0.93],['tired',1.00,'tired',1.00],['The',0.16,'The',0.17],['was',0.33,'was',0.44],
 ['The',0.32,'The',0.33],['The',0.38,'The',0.54],['tired',0.42,'tired',0.62],['The',0.38,'The',0.51]
]);
export const MEASURED = Object.freeze({sum1:true,finite:true,H_sm:1.067,H_sc:0.618,pattern_agree:1,bloc_sm:0.09,bloc_sc:0.091,drift_mean:0.162});
export const HEAD_SIZE = GRID.rows*GRID.cols;
export const FAULT_INDEX = 5*HEAD_SIZE+14*GRID.cols+23;
const MODES = new Set(['cross','softmax','difference']);
export function projectCell(h,r,c,mode='cross') {
 if(!MODES.has(mode))throw Error('unknown mode');
 if(!Number.isInteger(h)||h<0||h>=GRID.heads||!Number.isInteger(r)||r<0||r>=GRID.rows||!Number.isInteger(c)||c<0||c>=GRID.cols)throw RangeError('coordinate outside grid');
 const [,sm,,sc] = HEADS[h];
 // EXACT same deterministic texture as original 2D 16,356-cell page.
 const x=(c-(GRID.cols-1)/2)/(GRID.cols/2), y=(r-(GRID.rows-1)/2)/(GRID.rows/2);
 const radial=Math.hypot(x,y),az=Math.atan2(y,x);
 const envelope=Math.exp(-2.6*radial*radial);
 const interference=(Math.cos(5*az+1.6*radial+0.31*h)+1)/2;
 const texture=0.22+0.78*(0.68*envelope+0.32*interference);
 if(mode==='difference')return (sc-sm)*texture;
 return (mode==='cross'?sc:sm)*texture;
}
export function flatGrid(mode='cross') {
 if(!MODES.has(mode))throw Error('unknown mode');
 const out=new Float64Array(GRID.total);let i=0;
 for(let h=0;h<GRID.heads;h++)for(let r=0;r<GRID.rows;r++)for(let c=0;c<GRID.cols;c++)out[i++]=projectCell(h,r,c,mode);
 return out;
}
export function rotateHalfTurn(values) {
 if(values.length!==GRID.total)throw Error('incorrect grid size');
 const out=new Float64Array(values.length);
 for(let h=0;h<GRID.heads;h++)for(let r=0;r<GRID.rows;r++)for(let c=0;c<GRID.cols;c++){
  const src=h*HEAD_SIZE+r*GRID.cols+c;
  const dst=h*HEAD_SIZE+(GRID.rows-1-r)*GRID.cols+(GRID.cols-1-c);
  out[dst]=values[src];
 }
 return out;
}
export function coord(index){if(!Number.isInteger(index)||index<0||index>=GRID.total)throw RangeError('index'); const h=Math.floor(index/HEAD_SIZE),v=index%HEAD_SIZE;return {h,r:Math.floor(v/GRID.cols),c:v%GRID.cols};}
export function indexOf(h,r,c){return h*HEAD_SIZE+r*GRID.cols+c;}
export function canonicalIndex(displayIndex,orientation='a'){
 const {h,r,c}=coord(displayIndex);
 return orientation==='b'?indexOf(h,GRID.rows-1-r,GRID.cols-1-c):displayIndex;
}
export function makeState(mode='cross',orientation='a',fault=false){
 if(!MODES.has(mode)||!['a','b'].includes(orientation))throw Error('invalid state');
 const logical=flatGrid(mode);
 const display=orientation==='b'?rotateHalfTurn(logical):Float64Array.from(logical);
 if(fault)display[FAULT_INDEX]+=0.125;
 return {mode,orientation,fault,logical,display};
}
export function verify(state){
 const restored=state.orientation==='b'?rotateHalfTurn(state.display):Float64Array.from(state.display);
 let bad=-1;for(let i=0;i<GRID.total;i++)if(!Object.is(restored[i],state.logical[i])){bad=i;break;}
 return {accepted:bad===-1,badIndex:bad,crossings:bad===-1?1:0,checked:GRID.total,mode:state.mode,orientation:state.orientation,kind:'derived_grid_180_degree_permutation'};
}
export function coordinates3D(h,r,c){return [(c-23)/46*6.2,(h-5.5)/11*4.2,(r-14)/28*3.35];}
export function colorValue(v,mode){
 if(mode==='difference'){
  const t=Math.min(1,Math.abs(v)*2.8);
  return v>=0?[(12+220*t)/255,(17+145*t)/255,(24+55*t)/255]:[(12+70*t)/255,(24+90*t)/255,(31+220*t)/255];
 }
 const t=Math.max(0,Math.min(1,v));
 return mode==='cross'?[(10+179*t)/255,(20+220*t)/255,(24+98*t)/255]:[(6+25*t)/255,(15+190*t)/255,(22+225*t)/255];
}
export function makePointBuffers(state,headSelection='all'){
 const head= headSelection==='all'?-1:Number(headSelection);
 if(head!==-1&&(!Number.isInteger(head)||head<0||head>=GRID.heads))throw RangeError('head');
 const count=head===-1?GRID.total:HEAD_SIZE;
 const positions=new Float32Array(count*3),colors=new Float32Array(count*3),logicalIndices=new Uint32Array(count);
 let n=0;
 for(let h=0;h<GRID.heads;h++){
  if(head!==-1&&h!==head)continue;
  for(let r=0;r<GRID.rows;r++)for(let c=0;c<GRID.cols;c++){
   const idx=indexOf(h,r,c),v=state.display[idx];
   positions.set(coordinates3D(h,r,c),n*3);
   colors.set(colorValue(v,state.mode),n*3);
   logicalIndices[n]=idx;n++;
  }
 }
 return {positions,colors,logicalIndices,count};
}