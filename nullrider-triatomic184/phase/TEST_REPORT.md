# Test report — Node 184 `-{+{=}}` paired stationary/counter-rotating trial

Date: 2026-10-16. Baseline: Node184 Triatomic core + read-only Bayesian observer V1 (unmodified).

**Executed:** `node --test .../infer/infer.test.mjs .../phase/phase.test.mjs`

- Tests: 29/29 PASS (15 inherited, 14 new).
- Experiment: 100 paired world seeds, 36,500 cell observations, 3,507 hidden positive cells.
- 7.5° relative gate: accepts at inner angle 0° and 180° with equal/opposite outer angle; rejects phase-offset 90° and non-permitted events. Gate open fraction ~4.1667% of spin revolution under constant rates.
- True fault capture, exact 2% candidate selection: stationary 608/730 (83.29%), spinning 695/730 (95.21%), delta +87 over 100 independent scenarios, same budget, fixed one-per-primary-branch constraint.
- Scoring: Brier stationary 0.0542798; spinning 0.0424325; paired mean improvement 0.0118473; approximate 95% CI [0.0108465,0.0128481].
- Control a=0: no difference; both Brier 0.0563032.
- Counterexample: phase response does not reverse, but spinning observer assumes it does: spinning Brier 0.06945999, worse than stationary 0.0542798.
- 365 slots remained occupied; no read-only inference action mutated a core cell or receipt ledger.
- Phase signal is generated from ground truth *only inside the simulator*, not included in input to the estimator. Statistical advantage depends on this synthetic phase-sensitive measurement being valid.

**Verdict:** PASS under the specified synthetic assumption, FAIL to generalize without phase-sensitive empirical data. No proof of Planck-scale or quantum hardware mechanism. No live external receiver or physical toroid was tested.
