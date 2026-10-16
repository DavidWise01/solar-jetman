import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {syntheticBenchmark} from './synthetic.mjs';
const scenarios=[];
for(const missingFraction of [0,.25,.5,1]) {
  const t0=performance.now(),r=syntheticBenchmark(20801,40,missingFraction),elapsedMs=performance.now()-t0;
  scenarios.push({missingFraction,elapsedMs:Number(elapsedMs.toFixed(2)),...r});
}
const report={experiment:'NULLRIDER NODE184 READ-ONLY SYNTHETIC INFERENCE V1',
  benchmark:'40 independent holdout-world seeds 20801..20840 per missing-data condition; 365 cells each',
  source:'Unmodified ../engine.mjs for state, synthetic.mjs for ground truth and noisy observations',
  scoring:'Brier score vs age-only prior; precision/recall of high-confidence alerts, selective accuracy and coverage',
  assumptions:'Synthetic conditionally independent sensor likelihoods; prior matches synthetic generator. No training, pretrained weights, quantum/biological measurement, or real sensor calibration.',
  scenarios:scenarios.map(({rows,...summary})=>summary)};
fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
const cols=['missingFraction','totalCells','coverage','decidedAccuracy','alertPrecision','alertRecall','brier','priorBrier','missingNoSignal','elapsedMs'];
fs.writeFileSync(new URL('./results.csv',import.meta.url),cols.join(',')+'\n'+report.scenarios.map(s=>cols.map(k=>s[k]??'').join(',')).join('\n')+'\n');
console.log(JSON.stringify(report.scenarios.map(s=>({missing:s.missingFraction,coverage:s.coverage,precision:s.alertPrecision,recall:s.alertRecall,brier:s.brier,prior:s.priorBrier,ms:s.elapsedMs})),null,2));
