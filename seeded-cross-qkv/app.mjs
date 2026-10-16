import {GRID,FAULT_INDEX,coord,HEAD_SIZE} from './engine.mjs';
import {validateRecord,makeQKVState,verifyQKV,sourceCoordinate,stats,FIELDS,makeSyntheticFixture} from './data.mjs';
import {VolumeScene} from './scene_qkv.mjs';
const $=id=>document.getElementById(id);
let dataset=null, state=null, selected='all', lastReceipt=null, digest=null, importedFilename='';
const volume=new VolumeScene($('view3d'),showCell);
volume.onRenderer=(renderer)=>{$('rendererLabel').textContent=renderer.toUpperCase()+' / '+(state?GRID.total.toLocaleString():'AWAITING SOURCE');};
function status(message,tone=''){ $('status').textContent=message;$('status').className='status '+tone; }
function heads(){const panel=$('heads');for(let h=0;h<12;h++){
 const button=document.createElement('button');button.className='head';button.dataset.head=String(h);const n=document.createElement('span');n.textContent=`H${String(h).padStart(2,'0')}`;const sub=document.createElement('small');sub.textContent='64 features';button.append(n,sub);panel.append(button);
 }}
function sync(announce=true){if(!dataset)return;
 state=makeQKVState(dataset,$('mode').value,state?.orientation||'a',state?.fault||false);
 volume.setData(state,selected);$('rendererLabel').textContent=volume.engine.toUpperCase()+' / '+GRID.total.toLocaleString()+' RESAMPLED CELLS';$('sideA').classList.toggle('on',state.orientation==='a');$('sideB').classList.toggle('on',state.orientation==='b');
 $('hudMode').textContent=`${state.mode.toUpperCase()} · SOLAR ${state.orientation.toUpperCase()} · ${state.orientation==='b'?'180°':'0°'}`;
 $('visible').textContent=`${volume.buffer.count.toLocaleString()} / ${GRID.total.toLocaleString()} resampled points`;
 $('fault').textContent=state.fault?'CLEAR ONE-CELL FAULT':'INJECT ONE-CELL FAULT';
 $('heads').querySelectorAll('button[data-head]').forEach(x=>x.classList.toggle('active',x.dataset.head===selected));
 if(announce){lastReceipt=null;status('Grid loaded · VERIFY AT 0 to check exact 180° restoration.');}
}
function showCell(index){if(!state||!dataset)return;
 const display=coord(index), originalIndex=state.orientation==='b'?display.h*HEAD_SIZE+(28-display.r)*47+(46-display.c):index;
 const src=sourceCoordinate(originalIndex,dataset);const val=state.display[index];
 $('inspector').textContent=`Visual H${src.head} · row ${display.r}, col ${display.c} → measured query token ${src.query}, key token ${src.key} · ${state.mode}=${val.toFixed(6)} · mapped from ${dataset.tokens[src.query]} → ${dataset.tokens[src.key]}. Each measured entry may be shown in several 29×47 cells.`;
}
async function load(record,raw,filename){
 const check=validateRecord(record),sha=await digestBuffer(raw);
 dataset=record;importedFilename=filename;digest=sha;selected='all';state={orientation:'a',fault:false};
 $('source').textContent=`${filename} · ${record.model} · layer ${record.layer} · origin declared: ${check.declaredOrigin}`;
 $('native').textContent=`${check.measuredPositions.toLocaleString()} native H×N×N entries`;
 $('raster').textContent=`${GRID.total.toLocaleString()} resampled cells`;
 $('qk').textContent=`Q/K max error ${check.maxReconstructionError.toExponential(2)}`;
 $('hash').textContent=sha?`JSON SHA-256 ${sha.slice(0,16)}…`:'SHA-256 unavailable (insecure origin)';
 const info=stats(record);$('entropy').textContent=info.meanEntropy.toFixed(4);
 $('provenance').textContent=record.origin==='synthetic_test_only'?'SYNTHETIC TEST DATA · no pretrained model values':`USER-SUPPLIED FILE · declares ${record.model}; metadata not independently authenticated`;
 $('provenance').className='provenance '+(record.origin==='synthetic_test_only'?'synthetic':'claimed');
 $('N').textContent=String(check.tokens);
 sync();showCell(FAULT_INDEX);status(`Imported ${check.heads} heads × ${check.tokens} tokens. Q/K and causal attention mathematically consistent. This is not proof of model authorship.`,'ok');
}
async function digestBuffer(buf){if(!globalThis.crypto?.subtle)return null;const hash=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function parseBytes(buf,name){if(buf.byteLength>12*1024*1024)throw Error('JSON larger than 12 MiB');const text=new TextDecoder('utf-8',{fatal:true}).decode(buf);await load(JSON.parse(text),buf,name);}
function err(e){status('REJECT IMPORT · '+String(e.message||e),'no');}
$('upload').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{await parseBytes(await f.arrayBuffer(),f.name);}catch(x){err(x);}e.target.value='';});
$('demo').addEventListener('click',async()=>{try{const record=makeSyntheticFixture();const raw=new TextEncoder().encode(JSON.stringify(record)).buffer;await load(record,raw,'GENERATED SYNTHETIC DEMO');}catch(e){err(e);}});
$('heads').addEventListener('click',e=>{const el=e.target.closest('button[data-head]');if(!el||!dataset)return;selected=el.dataset.head;sync(false);});
$('mode').addEventListener('change',()=>sync());
$('sideA').addEventListener('click',()=>{if(!state)return;state.orientation='a';sync();});
$('sideB').addEventListener('click',()=>{if(!state)return;state.orientation='b';sync();});
$('fault').addEventListener('click',()=>{if(!state)return;state.fault=!state.fault;sync();});
$('verify').addEventListener('click',()=>{if(!state){status('Load JSON or test fixture first.','no');return;}
 const result=verifyQKV(state);
 lastReceipt={version:'seeded-cross-qkv-v1',time:new Date().toISOString(),filename:importedFilename,source_model_declared:dataset.model,source_origin_declared:dataset.origin,source_sha256:digest,model_authentication:'not_performed',signed:false,head_view:selected,grid:'12x29x47_resampled',source_shape:dataset.shape,field:state.mode,orientation:state.orientation,...result};
 status(result.accepted?`ACCEPT · ${result.checked.toLocaleString()} resampled cells restored · crossing count 1 · unsigned local receipt`:`REJECT · mutated cell ${result.badIndex+1} · crossing count 0` ,result.accepted?'ok':'no');
});
$('reset').addEventListener('click',()=>volume.setView(.68,.40,11.9));
$('spin').addEventListener('click',()=>{volume.spin=!volume.spin;$('spin').textContent=volume.spin?'PAUSE ROTATION':'RESUME ROTATION';});
$('copy').addEventListener('click',async()=>{if(!lastReceipt){status('No receipt yet. Verify first.');return;}const s=JSON.stringify(lastReceipt,null,2);try{await navigator.clipboard.writeText(s);status('Unsigned receipt copied.','ok');}catch(e){status('Clipboard permission refused.','no');}});
heads();volume.onRenderer(volume.engine);
window.SEEDED_QKV={get dataset(){return dataset},get state(){return state},get receipt(){return lastReceipt},get renderer(){return volume.engine},get visible(){return volume.buffer?.count||0},get hash(){return digest},verifyNow:()=>state?verifyQKV(state):null};