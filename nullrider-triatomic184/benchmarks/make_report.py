import json, textwrap, hashlib, datetime
from pathlib import Path
from xml.sax.saxutils import escape
D=Path(__file__).resolve().parent
x=json.loads((D/'results.json').read_text())
ss=x['scenarios'];p=x['performance']
q=lambda k: ' '.join(f'{s[k]:g}' if isinstance(s[k],(int,float)) else str(s[k]) for s in ss)
md=f'''# NULLRIDER / Triatomic Node 184 — Inference Benchmark

**Measured against existing `engine.mjs` (unchanged)**  
**Run timestamp:** {x['date_utc']}  
**Runtime:** Node {x['environment']['node']} / {x['environment']['platform']} / {x['environment']['architecture']}  
**Inference classification:** deterministic rule-based recovery, with non-learning missing-observation estimators; **not** a trained inference model.

## Verdict

The current controller is **strong at deterministic next-action prediction and restoring reported faults within a bounded 2% renewal budget**. It is **not able to infer truly unobservable damage** and it saturates if new faults arrive faster than the 7.3-slot/cycle average replacement rate. The fully observed 100% policy-prediction score is a *white-box reproduction of its documented ranking rule*, not model generalization.

## What was actually exercised

- `3 × 118 + 11 = 365` slots, fully routed through `through184()` at Node 184.
- 400 scenario renewal cycles (100 each): clean, sparse faults (2 every fourth cycle), bursty faults (12 every tenth cycle), and overload (attempted 12 new faults per cycle, limited to previously nonfaulty slots).
- Exactly 73 replacements per ten-cycle block, 730 per hundred; population always 365.
- Before every cycle, **predict the IDs** the controller will renew; then call actual `RENEW` and compare predicted IDs with observed IDs.
- Test full-policy lookahead; health/age-only proxy; age-only estimator; quota-respecting random baseline; and incomplete-view estimators with 10%, 25%, or 50% of cells missing `health` and `fault` fields.
- Separate external hidden-fault counterexample where the gate receives **no observable evidence** of damage.

## Recovery benchmark

| Scenario | Faults injected | Repaired | Remaining | Peak backlog | Cells renewed |
|---|---:|---:|---:|---:|---:|
'''
for s in ss:md+=f"| {s['scenario']} | {s['total_injected_faults']} | {s['total_repaired_faults']} | {s['remaining_faults']} | {s['peak_fault_backlog']} | {s['total_replacements']} |\n"
md+='''
Overload attempts twelve new faults per cycle; injections stop at the number of still-nonfaulty slots available. Consequently the 100-cycle run injected 1,080 distinct fault events, not 1,200. Under normal/sparse conditions, repair occurs at the next renewal. Under burst or overload, the fixed quota leaves a backlog. Reserve addresses are not forced to renew each cycle; the three major branches are.

## Next-renewal inference benchmark

**Metric:** top-*k* overlap = fraction of actual renewed cell IDs that the estimator predicted, using the real cycle quota (7 or 8). These values describe predicted renewal **decisions**, not diagnoses of hidden damage. The random baseline retains the mandatory major-branch distribution.

| Scenario | Exact-known rule | Health+age, no fault flag | Age only | Random | 10% hidden | 25% hidden | 50% hidden |
|---|---:|---:|---:|---:|---:|---:|---:|
'''
for s in ss:md+=f"| {s['scenario']} | {s['topk_recall_full_policy_pct']:.2f}% | {s['topk_recall_health_age_proxy_pct']:.2f}% | {s['topk_recall_age_only_pct']:.2f}% | {s['topk_recall_random_pct']:.2f}% | {s['topk_recall_missing10_pct']:.2f}% | {s['topk_recall_missing25_pct']:.2f}% | {s['topk_recall_missing50_pct']:.2f}% |\n"
md+=f'''
### What this means

1. **White-box lookahead is perfect** because the code reveals the policy. Do not claim this as learned reasoning or predictive intelligence.
2. **Health+age is enough in this particular simulation** to reproduce actions even without an explicit fault flag, because the `FAULT` operation sets health to zero. This is a **visible proxy**, not discovery of an unknown state.
3. **Partial views degrade prediction**: 25% masked health/fault fields reduce top-*k* overlap to {ss[0]['topk_recall_missing25_pct']:.2f}% (clean), {ss[1]['topk_recall_missing25_pct']:.2f}% (sparse), {ss[2]['topk_recall_missing25_pct']:.2f}% (bursty), and {ss[3]['topk_recall_missing25_pct']:.2f}% (overload). Missing values are estimated from age using a deliberately simple non-trained heuristic.
4. **Unobserved faults cannot be identified:** two separate instances with identical observable cell states but differing externally asserted latent damage produce identical actions. This is an observability limit, not an implementational failure.
5. **No calibrated confidence**, conditional probability model, trained weight update, out-of-distribution detector, or learning loop exists in the current engine.

## Performance microbenchmark

Measured in the local container, one Node process, one 1,500-cycle run; no workload parallelization or storage writes:

| Metric | Result |
|---|---:|
| Average renewal call | {p['mean_renew_ms']:.4f} ms |
| Median renewal | {p['p50_renew_ms']:.4f} ms |
| p95 renewal | {p['p95_renew_ms']:.4f} ms |
| p99 renewal | {p['p99_renew_ms']:.4f} ms |
| Implied renewal throughput | {p['speed_cycles_per_second']:,.0f} cycles/s |
| Full `VIEW` after 1,500 entries | {p['full_view_1500_event_ms']:.3f} ms |
| Resident process memory at end | {p['process_rss_mib']:.2f} MiB |
| Final population | {p['final_occupancy']} |

Throughput varies by machine and node runtime. `VIEW` serializes the full ledger, so its cost grows with accumulated events; no persistent-disk durability is present.

## Symbolic topology

```text
                       NODE 184 : ONLY GATE
                              |
           +------------------+------------------+
           |                  |                  |
        TACH -2            GYRO 0             POSI +3
        118 slots          118 slots           118 slots
           +------------------+------------------+
                              |
                        11 RESERVES
                              |
                       365 FULL SLOTS
                              |
                  INPUT: FAULT / HEALTH / AGE
                              |
                 RANK + RESERVE QUOTA (2%)
                              |
                    RENEW / LOG / VERIFY
                              |
                   NO LATENT-STATE SENSOR
```

## Next engineering target

Add a **read-only `INFER` action via Node 184** that returns predicted fault probability, confidence, missing-data flags, and an abstention decision. Build synthetic but *held-out* sensor data with documented ground truth; split it into train and test streams, compare against age-only/health-only baselines, and keep the 2%-renewal controller as the downstream decision policy. Use an explicit error budget and never allow guesses to overwrite valid cells without verification. Test overload separately and introduce a configurable, audited repair budget only if the user's 2% governance constraint permits.

## Reproduction

```bash
cd nullrider-triatomic184
node benchmarks/inference_benchmark.mjs
node --test engine.test.mjs benchmarks/inference_benchmark.test.mjs
```

This reruns the 400-scenario cycles and 1,500-cycle microbenchmark. `cycles.csv` holds 400 rows of underlying scores and recovery counts. `results.json` holds summaries. No runtime or kernel implementation was modified.

**Scope:** all tests are software simulations. These data do not validate actual cellular homeostasis, Planck bubbles, atomic shell mechanics, independent AI intelligence, or physical time dilation. Signatures and persistent receipts are not provided by this model.
'''
(D/'INFERENCE_BENCHMARK.md').write_text(md)
print('Wrote Markdown',len(md),'bytes')

# Formatted PDF for independent review.
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
from reportlab.lib.units import inch
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleA',fontName='Helvetica-Bold',fontSize=20,leading=24,textColor=colors.HexColor('#152b38'),spaceAfter=10))
styles.add(ParagraphStyle(name='HeadA',fontName='Helvetica-Bold',fontSize=10.5,leading=12,textColor=colors.HexColor('#176b68'),spaceBefore=8,spaceAfter=4))
styles.add(ParagraphStyle(name='BodyA',fontName='Helvetica',fontSize=9.0,leading=12,spaceAfter=4))
styles.add(ParagraphStyle(name='SmallA',fontName='Helvetica',fontSize=7.8,leading=10,textColor=colors.HexColor('#526470'),spaceAfter=3))
styles.add(ParagraphStyle(name='Cell',fontName='Helvetica',fontSize=8.5,leading=11))
P=lambda t,st='BodyA':Paragraph(escape(str(t)),styles[st])
PHTML=lambda t,st='BodyA':Paragraph(t,styles[st])
body=[P('NULLRIDER / NODE 184','TitleA'),P('Inference & Homeostasis Benchmark  |  16 October 2026','SmallA'),
 PHTML('<b>Verdict:</b> Strong deterministic fault recovery with visible state. Not yet a learned inference engine. Predicting its known selection rule is not evidence of generalization.'),
 P('Measured operating conditions','HeadA'),
 P('365 slots: 3 x 118 branches + 11 reserves; 2% turnover (73 slots per 10 cycles); all actions through Node 184. Four scenarios x 100 renewal cycles, with incomplete-observation prediction tests.'),
 P('Recovery under load','HeadA')]
def maketable(rows,widths=None):
 cells=[[P(str(v),'Cell') for v in row] for row in rows]
 t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eaf2f1')),
  ('LINEBELOW',(0,0),(-1,0),.7,colors.HexColor('#a6c7c3')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f8f8')]),
  ('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),
  ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7)]))
 return t
body.append(maketable([['Scenario','Injected','Repaired','Backlog','Replaced']]+[[s['scenario'],s['total_injected_faults'],s['total_repaired_faults'],s['remaining_faults'],s['total_replacements']] for s in ss],[106,77,77,77,94]))
body.extend([Spacer(1,8),P('Overload exceeds the fixed capacity of about 7.3 replacements/cycle. All 365 positions remain occupied, but the outstanding fault queue grows.','SmallA'),
 P('Decision prediction under missing information','HeadA')])
body.append(maketable([['Scenario','Known policy','25% masked','50% masked','Age-only']]+[[s['scenario'],f"{s['topk_recall_full_policy_pct']:.0f}%",f"{s['topk_recall_missing25_pct']:.1f}%",f"{s['topk_recall_missing50_pct']:.1f}%",f"{s['topk_recall_age_only_pct']:.1f}%"] for s in ss],[106,94,94,94,94]))
body.extend([Spacer(1,5),P('Metric: overlap between predicted and actual 7/8-slot renewal IDs. White-box lookahead replicates the known ranking rule (100%), not a trained model. A 25% mask hides health and fault fields for one quarter of candidate cells.','SmallA'),
 P('Observability limit','HeadA'),
 P('If physical damage is never reported through the Node 184 API, two engines with identical visible snapshots make identical choices. The current controller cannot recover information that is absent from all observations.'),
 P('Latency (local Node.js, single-thread microbenchmark)','HeadA'),
 P(f"Mean renewal: {p['mean_renew_ms']:.3f} ms | p95: {p['p95_renew_ms']:.3f} ms | approx. {p['speed_cycles_per_second']:,.0f} renewal calls/s. One full VIEW with 1,500 logged events: {p['full_view_1500_event_ms']:.2f} ms."),
 P('Conclusion / next gate','HeadA'),
 P('Expose a read-only INFER operation through 184, add genuine (but still simulated) partially observed sensor streams with held-out labels, calibrate confidence, and abstain on insufficient evidence. Keep repair actions conditional on the existing preservation and renewal policy.'),
 P('Reproduce','HeadA'),
 P('node benchmarks/inference_benchmark.mjs ; node --test engine.test.mjs benchmarks/inference_benchmark.test.mjs','SmallA'),
 P('Not quantum or biological measurements; 365 virtual slots and 184 are symbolic model addresses. In-memory receipts are not signed or persistent.','SmallA')])
pdf=D/'INFERENCE_BENCHMARK.pdf'
doc=SimpleDocTemplate(str(pdf),pagesize=letter,rightMargin=42,leftMargin=42,topMargin=40,bottomMargin=38)
def footer(canvas,doc):
 canvas.saveState();canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#667882'));
 canvas.drawString(43,22,'NULLRIDER / INFERENCE BENCHMARK • SOFTWARE SIMULATION');
 canvas.drawRightString(letter[0]-43,22,f'Page {doc.page}');canvas.restoreState()
doc.build(body,onFirstPage=footer,onLaterPages=footer)
print('Wrote PDF',pdf.stat().st_size,'bytes')
