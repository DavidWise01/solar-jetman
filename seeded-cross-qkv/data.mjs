// Real Q/K/V file adapter. Exactly 12 heads x N tokens x 64 features for DistilGPT2 layer 0.
// The 29x47 lattice is an explicitly labeled resampling of real N x N attention.
import {GRID,rotateHalfTurn,FAULT_INDEX,HEAD_SIZE,coordinates3D} from './engine.mjs';
const FINITE=(v)=>typeof v==='number'&&Number.isFinite(v);
export function validateRecord(data) {
 if(!data||data.format!=='seeded-cross-qkv-v1')throw Error('unknown export format');
 const N=data.shape?.tokens,H=data.shape?.heads,D=data.shape?.head_dim;
 if(H!==12||D!==64||!Number.isInteger(N)||N<2||N>64)throw Error('expected 12 heads, 64 features and 2–64 tokens');
 if(!Array.isArray(data.token_ids)||data.token_ids.length!==N||!Array.isArray(data.tokens)||data.tokens.length!==N)throw Error('invalid token metadata');
 for(const kind of ['q','k','v']) {
  const heads=data[kind];if(!Array.isArray(heads)||heads.length!==H)throw Error(kind+': 12 heads required');
  for(const one of heads){if(!Array.isArray(one)||one.length!==N)throw Error(kind+': token count');for(const vec of one)if(!Array.isArray(vec)||vec.length!==D||!vec.every(FINITE))throw Error(kind+': invalid vector');}
 }
 const a=data.attention;if(!Array.isArray(a)||a.length!==H)throw Error('attention: 12 heads required');
 let maxError=0;
 for(let h=0;h<H;h++) {
  if(!Array.isArray(a[h])||a[h].length!==N)throw Error('attention row count');
  for(let i=0;i<N;i++){
   const row=a[h][i];if(!Array.isArray(row)||row.length!==N||!row.every(x=>FINITE(x)&&x>=0&&x<=1+1e-5))throw Error('attention values');
   let total=0;const scores=[];
   for(let j=0;j<=i;j++){total+=row[j];let dot=0;for(let d=0;d<D;d++)dot+=data.q[h][i][d]*data.k[h][j][d];scores.push(dot/Math.sqrt(D));}
   for(let j=i+1;j<N;j++)if(row[j]>1e-6)throw Error('causal mask violated');
   if(Math.abs(total-1)>1e-4)throw Error('attention row is not normalized');
   const max=Math.max(...scores),ex=scores.map(s=>Math.exp(s-max)),z=ex.reduce((x,y)=>x+y,0);
   for(let j=0;j<=i;j++)maxError=Math.max(maxError,Math.abs(ex[j]/z-row[j]));
  }
 }
 // Check weights are numerically compatible with Q @ K^T causal softmax. NOT proof of model provenance.
 if(maxError>2e-3)throw Error('attention does not agree with supplied Q/K (max error '+maxError.toFixed(5)+')');
 return {heads:H,tokens:N,headDim:D,measuredPositions:H*N*N,maxReconstructionError:maxError,declaredOrigin:String(data.origin||'unknown')};
}
export const FIELDS=['attention','alignment','value'];
export function dataToGrid(data,field='attention') {
 if(!FIELDS.includes(field))throw Error('unknown field');
 const N=data.shape.tokens,D=data.shape.head_dim,out=new Float64Array(GRID.total);let index=0;
 for(let h=0;h<GRID.heads;h++)for(let r=0;r<GRID.rows;r++)for(let c=0;c<GRID.cols;c++){
  const i=Math.min(N-1,Math.floor(r*N/GRID.rows)),j=Math.min(N-1,Math.floor(c*N/GRID.cols));let v;
  if(field==='attention')v=data.attention[h][i][j];
  else if(field==='alignment'){let sum=0;for(let d=0;d<D;d++)sum+=data.q[h][i][d]*data.k[h][j][d];v=Math.tanh(sum/Math.sqrt(D)/4);}
  else {let sum=0;for(let d=0;d<D;d++)sum+=data.v[h][j][d]**2;v=Math.tanh(Math.sqrt(sum/D)/3);}
  out[index++]=v;
 }
 return out;
}
export function makeQKVState(data,field='attention',orientation='a',fault=false) {
 const logical=dataToGrid(data,field),display=orientation==='b'?rotateHalfTurn(logical):Float64Array.from(logical);
 if(fault)display[FAULT_INDEX]+=0.125;
 return {logical,display,mode:field,orientation,fault};
}
export function verifyQKV(state){
 const restored=state.orientation==='b'?rotateHalfTurn(state.display):state.display;
 let firstBad=-1;for(let i=0;i<GRID.total;i++){if(!Object.is(restored[i],state.logical[i])){firstBad=i;break;}}
 return {accepted:firstBad===-1,crossings:firstBad===-1?1:0,badIndex:firstBad,checked:GRID.total,kind:'imported_qkv_resampled_180_degree_permutation'};
}
export function pointBuffers(state,head='all') {
 const selected=head==='all'?-1:Number(head);
 if(selected!==-1&&(!Number.isInteger(selected)||selected<0||selected>=12))throw Error('head selection');
 const count=selected===-1?GRID.total:HEAD_SIZE,positions=new Float32Array(count*3),colors=new Float32Array(count*3),logicalIndices=new Uint32Array(count);let n=0;
 for(let h=0;h<12;h++){if(selected!==-1&&selected!==h)continue;
  for(let r=0;r<29;r++)for(let c=0;c<47;c++){
   const idx=h*HEAD_SIZE+r*47+c,v=state.display[idx],t=state.mode==='alignment'?(v+1)/2:Math.max(0,Math.min(1,v));
   positions.set(coordinates3D(h,r,c),3*n);
   if(state.mode==='alignment')colors.set([0.2+0.65*t,0.22+0.42*t,0.65-0.45*t],3*n);
   else if(state.mode==='value')colors.set([0.35+0.55*t,0.2+0.58*t,0.12+0.35*t],3*n);
   else colors.set([0.08+0.40*t,0.14+0.85*t,0.21+0.65*t],3*n);
   logicalIndices[n]=idx;n++;
  }
 }
 return {positions,colors,logicalIndices,count};
}
export function sourceCoordinate(index,data){const h=Math.floor(index/HEAD_SIZE),v=index%HEAD_SIZE,r=Math.floor(v/47),c=v%47,N=data.shape.tokens;return {head:h,query:Math.min(N-1,Math.floor(r*N/29)),key:Math.min(N-1,Math.floor(c*N/47)),r,c};}
export function stats(data){const N=data.shape.tokens;let entropy=0,n=0;
 for(const head of data.attention)for(const row of head){for(const w of row)if(w>0)entropy-=w*Math.log(w);n++;}
 return {meanEntropy:entropy/n,nativePositions:12*N*N};
}
// Deterministic, explicitly synthetic browser demo; NEVER mislabeled as model output.
export function makeSyntheticFixture(){
 let seed=16356>>>0;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed/4294967296-.5)*.8;};
 const H=12,N=5,D=64;
 const vec=()=>Array.from({length:H},()=>Array.from({length:N},()=>Array.from({length:D},next)));
 const q=vec(),k=vec(),v=vec(),attention=[];
 for(let h=0;h<H;h++){
  const rows=[];
  for(let i=0;i<N;i++){
   const scores=[];for(let j=0;j<=i;j++){let s=0;for(let d=0;d<D;d++)s+=q[h][i][d]*k[h][j][d];scores.push(s/Math.sqrt(D));}
   const m=Math.max(...scores),weights=scores.map(s=>Math.exp(s-m)),z=weights.reduce((a,b)=>a+b,0);
   rows.push(Array.from({length:N},(_,j)=>j<=i?weights[j]/z:0));
  }
  attention.push(rows);
 }
 return {format:'seeded-cross-qkv-v1',origin:'synthetic_test_only',model:'NONE_SYNTHETIC_DATA',layer:0,prompt:'Synthetic 5-token deterministic demo, not pretrained',tokens:Array.from({length:N},(_,i)=>'TEST_'+i),token_ids:[0,1,2,3,4],shape:{heads:H,tokens:N,head_dim:D},attention_kind:'synthetic_causal_softmax',q,k,v,attention};
}