import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const results=JSON.parse(fs.readFileSync(path.join(here,'results.json'),'utf8'));
const lines=fs.readFileSync(path.join(here,'cycles.csv'),'utf8').trim().split('\n');
const rows=lines.slice(1).map(s=>{const arr=s.split(',');return Object.fromEntries(lines[0].split(',').map((k,i)=>[k,arr[i]]));});
test('four distinct tested scenario labels',()=>assert.deepEqual(results.scenarios.map(s=>s.scenario),['clean','sparse','bursty','overload']));
test('exactly 400 observed policy steps',()=>assert.equal(rows.length,400));
test('100% known-policy prediction in every scenario',()=>assert.ok(results.scenarios.every(s=>s.exact_selection_full_policy_pct===100)));
test('all four scenarios preserve 365 positions',()=>assert.ok(results.scenarios.every(s=>s.occupancy_final===365)));
test('2% discrete renewal quota',()=>{
  for(const s of results.scenarios){const rs=rows.filter(r=>r.scenario===s.scenario);assert.equal(rs.length,100);
    for(let k=0;k<10;k++)assert.equal(rs.slice(k*10,k*10+10).reduce((a,r)=>a+Number(r.renewal_quota),0),73);
    assert.equal(rs.reduce((a,r)=>a+Number(r.renewal_quota),0),730);
  }
});
test('fault accounting is conserved for each cycle',()=>{
 for(const r of rows){assert.equal(Number(r.open_faults_before)-Number(r.fault_repaired),Number(r.fault_backlog_after));
 assert.ok(Number(r.fault_repaired)<=Number(r.renewal_quota));}
});
test('each branch gets renewal and no overfill',()=>{
 for(const s of results.scenarios){assert.equal(Object.values(s.band_replacements).reduce((a,b)=>a+b,0),730);
 for(const key of ['TACH','GYRO','POSI'])assert.ok(s.band_replacements[key]>=100);
 }});
test('sparse faults fully cleared',()=>{const s=results.scenarios[1];assert.equal(s.total_injected_faults,50);assert.equal(s.remaining_faults,0);});
test('overload queues faults instead of silently declaring stable',()=>{const s=results.scenarios[3];assert.ok(s.remaining_faults>0);assert.equal(s.final_stability,'SERVICE_REQUIRED');});
test('masked observation benchmark is worse than perfect white-box lookahead',()=>assert.ok(results.scenarios.every(s=>s.topk_recall_missing50_pct<100)));
test('unreported latent fault produces indistinguishable engine choices',()=>{const l=results.latent_information_limit;assert.equal(l.two_worlds_same_observable_state,true);assert.equal(l.identical_deterministic_action,true);});
test('no claims of inferred hidden physical states',()=>assert.ok(results.caveats.some(x=>x.includes('not physical'))));
