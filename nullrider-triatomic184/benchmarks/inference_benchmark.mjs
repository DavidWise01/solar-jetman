/* NULLRIDER Triatomic184: deterministic policy / missing-observation inference benchmark.
   Runs against the unmodified engine.mjs. No pretrained network or physics claim. */
import {performance} from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTriatomic184, COUNT, NODE} from '../engine.mjs';

const outDir=path.dirname(fileURLToPath(import.meta.url));
const now=()=>performance.now();
function rngFactory(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
const snapshot=e=>e.through184({via:NODE,op:'VIEW'}).snapshot;
function quotaFor(nextCycle){return 7+ (Math.floor(nextCycle*3/10)-Math.floor((nextCycle-1)*3/10));}
function select(cells, nextCycle, mode='full', hidden=new Set()){
  const quota=quotaFor(nextCycle);
  const records=cells.map(c=>{
    const unseen=hidden.has(c.id);
    const age=c.age+1;
    const health=unseen?Math.max(0,Number((100-.15*age).toFixed(2))):Math.max(0,Number((c.health-.15).toFixed(2)));
    const fault=unseen?false:c.fault;
    const risk=mode==='age'?age:((mode==='full'&&fault)?1e6:0)+(100-health)*100+age*.01;
    return {...c,age,health,fault,risk};
  });
  function desc(a,b){return b.risk-a.risk||a.id-b.id;}
  const chosen=[];
  for(const band of ['TACH','GYRO','POSI']) chosen.push(records.filter(c=>c.band===band).sort(desc)[0]);
  const ids=new Set(chosen.map(c=>c.id));
  chosen.push(...records.filter(c=>!ids.has(c.id)).sort(desc).slice(0,quota-chosen.length));
  return chosen.map(c=>c.id);
}
function randomChoice(cells, nextCycle, rand){
 const quota=quotaFor(nextCycle), selection=[];
 for(const band of ['TACH','GYRO','POSI']){
  const pool=cells.filter(c=>c.band===band); selection.push(pool[Math.floor(rand()*pool.length)].id);
 }
 const pool=cells.filter(c=>!selection.includes(c.id));
 for(let i=0;i<quota-3;i++){const j=Math.floor(rand()*pool.length);selection.push(pool.splice(j,1)[0].id);}
 return selection;
}
function pickFreshFaults(e,count,rand,idPrefix){
 if(!count)return [];
 const cells=snapshot(e).cells;
 const eligible=cells.filter(c=>!c.fault).map(c=>c.id);
 const ids=[];
 for(let i=0;i<Math.min(count,eligible.length);i++){
  const j=Math.floor(rand()*eligible.length), id=eligible.splice(j,1)[0];
  const response=e.through184({via:NODE,op:'FAULT',cell:id,tx:`${idPrefix}-f-${i}`});
  if(!response.accepted)throw Error('Fault setup rejected');
  ids.push(id);
 }
 return ids;
}
function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;}
function round(x,n=4){return Number(x.toFixed(n));}
function pct(a,b){return b?100*a/b:0;}
function score(candidate,truth){const t=new Set(truth);return candidate.filter(i=>t.has(i)).length/truth.length;}
function runScenario({name,cycles,seed,inject}){
 const e=createTriatomic184(),rand=rngFactory(seed),rows=[];
 let fullExact=0,fullRecall=0,proxyExact=0,proxyRecall=0,ageRecall=0,randomRecall=0;
 let totalPreexistingFaults=0,totalRepairedFaults=0,totalInjected=0,totalRenewed=0,maxBacklog=0;
 let residue=0,bandTotals={TACH:0,GYRO:0,POSI:0,RESERVE:0};
 const masking={10:[],25:[],50:[]};
 for(let step=1;step<=cycles;step++){
  const added=pickFreshFaults(e,inject(step),rand,`${name}-${step}`);totalInjected+=added.length;
  const before=snapshot(e),c=before.cells,q=quotaFor(step),faultSet=new Set(c.filter(x=>x.fault).map(x=>x.id));
  const full=select(c,step,'full'),proxy=select(c,step,'proxy'),aged=select(c,step,'age');
  const random=randomChoice(c,step,rand);
  const missing={};
  for(const portion of [10,25,50]){
    const hidden=new Set(); for(const cell of c)if(rand()*100<portion)hidden.add(cell.id);
    missing[portion]=select(c,step,'full',hidden);
  }
  const t0=now(), r=e.through184({via:NODE,op:'RENEW',tx:`${name}-${step}-renew`}), latency=now()-t0;
  if(!r.accepted)throw Error('RENEW rejected');
  const truth=r.event.details.retired.map(x=>x.id);
  if(r.event.details.quota!==q)throw Error('Quota mismatch');
  const overlap=arr=>score(arr,truth);
  if(new Set(full).size!==q)throw Error('Policy prediction duplicated IDs');
  if(JSON.stringify([...full].sort((a,b)=>a-b))!==JSON.stringify([...truth].sort((a,b)=>a-b))) throw Error(`White-box prediction mismatch: ${name} cycle ${step}`);
  fullExact++; 
  proxyExact+=+(new Set(proxy).size===q&&overlap(proxy)===1);
  fullRecall+=overlap(full);proxyRecall+=overlap(proxy);ageRecall+=overlap(aged);randomRecall+=overlap(random);
  for(const p of [10,25,50]) masking[p].push(overlap(missing[p]));
  const actualFaultsRepaired=truth.filter(id=>faultSet.has(id)).length;
  totalPreexistingFaults+=faultSet.size;totalRepairedFaults+=actualFaultsRepaired;
  totalRenewed+=q;
  for(const x of r.event.details.retired)bandTotals[x.band]++;
  const left=r.stats.faults;
  if(left!==faultSet.size-actualFaultsRepaired)throw Error('Fault reconciliation invariant');
  if(r.stats.occupied!==COUNT)throw Error('Population change');
  residue=left;maxBacklog=Math.max(maxBacklog,left);
  rows.push({scenario:name,cycle:step,new_faults:added.length,open_faults_before:faultSet.size,renewal_quota:q,
    fault_repaired:actualFaultsRepaired,fault_backlog_after:left,
    full_policy_topk_recall:round(overlap(full)),proxy_topk_recall:round(overlap(proxy)),
    age_topk_recall:round(overlap(aged)),random_topk_recall:round(overlap(random)),
    missing10_topk_recall:round(overlap(missing[10])),missing25_topk_recall:round(overlap(missing[25])),
    missing50_topk_recall:round(overlap(missing[50])),renew_ms:round(latency,5)});
 }
 const s=snapshot(e);
 return {summary:{scenario:name,cycles,initial_cells:COUNT,total_injected_faults:totalInjected,
    total_replacements:totalRenewed,expected_replacements:cycles*7.3,
    total_repaired_faults:totalRepairedFaults,repair_share_of_fault_inventory:pct(totalRepairedFaults,totalPreexistingFaults),
    remaining_faults:residue,peak_fault_backlog:maxBacklog,
    exact_selection_full_policy_pct:round(pct(fullExact,cycles),2),
    topk_recall_full_policy_pct:round(pct(fullRecall,cycles),2),
    exact_selection_health_age_proxy_pct:round(pct(proxyExact,cycles),2),
    topk_recall_health_age_proxy_pct:round(pct(proxyRecall,cycles),2),
    topk_recall_age_only_pct:round(pct(ageRecall,cycles),2),
    topk_recall_random_pct:round(pct(randomRecall,cycles),2),
    topk_recall_missing10_pct:round(100*mean(masking[10]),2),
    topk_recall_missing25_pct:round(100*mean(masking[25]),2),
    topk_recall_missing50_pct:round(100*mean(masking[50]),2),
    band_replacements:bandTotals,occupancy_final:s.occupied,final_stability:s.verdict,final_log_size:s.logSize},rows};
}
function speedBench(){
 const e=createTriatomic184(),times=[];
 for(let i=0;i<1500;i++){
  const start=now();const r=e.through184({via:NODE,op:'RENEW',tx:`speed-${i}`});
  if(!r.accepted)throw Error('speed run failure');times.push(now()-start);
 }
 times.sort((a,b)=>a-b);
 const quantile=p=>times[Math.min(times.length-1,Math.floor(p*(times.length-1)))];
 const st=now();const s=snapshot(e);const viewMs=now()-st;
 return {cycles:1500,total_renewals:s.renewedTotal,mean_renew_ms:round(mean(times),5),p50_renew_ms:round(quantile(.5),5),p95_renew_ms:round(quantile(.95),5),
    p99_renew_ms:round(quantile(.99),5),speed_cycles_per_second:round(1000/mean(times),1),full_view_1500_event_ms:round(viewMs,3),
    ledger_entries:s.logSize,final_occupancy:s.occupied,process_rss_mib:round(process.memoryUsage().rss/(1024*1024),2)};
}
function hiddenStateTest(){
 const a=createTriatomic184(),b=createTriatomic184();
 const visibleA=snapshot(a),visibleB=snapshot(b);
 // External latent fault is withheld completely: engine receives no distinguishing observation.
 const latentB={cell:184,damaged:true};
 const sameBefore=visibleA.fingerprint===visibleB.fingerprint;
 const resultA=a.through184({via:NODE,op:'RENEW',tx:'unobserved'});
 const resultB=b.through184({via:NODE,op:'RENEW',tx:'unobserved'});
 return {two_worlds_same_observable_state:sameBefore,latent_damage_only_in_external_truth:latentB,
  identical_deterministic_action:JSON.stringify(resultA.event.details.retired.map(c=>c.id))===JSON.stringify(resultB.event.details.retired.map(c=>c.id)),
  reason:'Hidden information without a sensor, observation, or prior cannot be inferred by the existing Node 184 API.'};
}
const scenarios=[
{name:'clean',cycles:100,seed:18401,inject:()=>0},
{name:'sparse',cycles:100,seed:18402,inject:n=>n%4===0?2:0},
{name:'bursty',cycles:100,seed:18403,inject:n=>n%10===0?12:0},
{name:'overload',cycles:100,seed:18404,inject:()=>12},
];
const runs=scenarios.map(runScenario),perf=speedBench(),hidden=hiddenStateTest();
const totals=runs.map(r=>r.summary);
const results={title:'NULLRIDER Node 184 deterministic-policy and partial-observation inference benchmark',
  date_utc:new Date().toISOString(),implementation:'Existing engine.mjs unchanged',
  environment:{node:process.version,platform:process.platform,architecture:process.arch},
  constraints:{gateway:184,capacity:365,bands:[118,118,118,11],renew_per_10_cycles:73,
    partial_observation_masked_fields:['fault','health'],ground_truth:'Engine chosen retirement IDs'},
  definitions:{full_policy:'White-box deterministic lookahead of known engine ranking; not machine learning',
    health_age_proxy:'Estimator uses health+age but not explicit fault flag',
    masked:'10%, 25%, or 50% of cells hide health/fault; hidden health approximated from age',
    age_only:'Estimator uses only cell age and branch membership',
    random:'Uniform random quota respecting one renewal per major branch',
    latent:'Unreported outside damage is impossible to detect from identical observations'},
  scenarios:totals,performance:perf,latent_information_limit:hidden,
  caveats:['Synthetic fault injection, not physical sensor faults','All cell faults observed by engine via FAULT; no unknown-damage detector',
           'Full-policy prediction replicates documented deterministic selection logic and is not independently learned',
           'This is a microbenchmark, not quantum computation, real cell biology, or Planck physics',
           'In-memory gate and ledger; no persistence across process restart or cryptographic authentication']};
fs.writeFileSync(path.join(outDir,'results.json'),JSON.stringify(results,null,2)+'\n');
const columns=Object.keys(runs[0].rows[0]);
fs.writeFileSync(path.join(outDir,'cycles.csv'),columns.join(',')+'\n'+runs.flatMap(r=>r.rows).map(x=>columns.map(k=>x[k]).join(',')).join('\n')+'\n');
console.log(JSON.stringify({scenarios:totals,performance:perf,hidden},null,2));
