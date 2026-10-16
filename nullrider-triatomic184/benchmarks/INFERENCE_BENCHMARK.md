# NULLRIDER / Triatomic Node 184 — Inference Benchmark

**Measured against existing `engine.mjs` (unchanged)**  
**Run timestamp:** 2026-10-16T15:03:09.989Z  
**Runtime:** Node v22.16.0 / linux / x64  
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
| clean | 0 | 0 | 0 | 0 | 730 |
| sparse | 50 | 50 | 0 | 0 | 730 |
| bursty | 120 | 116 | 4 | 4 | 730 |
| overload | 1080 | 730 | 350 | 351 | 730 |

Overload attempts twelve new faults per cycle; injections stop at the number of still-nonfaulty slots available. Consequently the 100-cycle run injected 1,080 distinct fault events, not 1,200. Under normal/sparse conditions, repair occurs at the next renewal. Under burst or overload, the fixed quota leaves a backlog. Reserve addresses are not forced to renew each cycle; the three major branches are.

## Next-renewal inference benchmark

**Metric:** top-*k* overlap = fraction of actual renewed cell IDs that the estimator predicted, using the real cycle quota (7 or 8). These values describe predicted renewal **decisions**, not diagnoses of hidden damage. The random baseline retains the mandatory major-branch distribution.

| Scenario | Exact-known rule | Health+age, no fault flag | Age only | Random | 10% hidden | 25% hidden | 50% hidden |
|---|---:|---:|---:|---:|---:|---:|---:|
| clean | 100.00% | 100.00% | 100.00% | 2.86% | 95.79% | 87.39% | 75.61% |
| sparse | 100.00% | 100.00% | 93.34% | 1.86% | 94.54% | 85.86% | 75.05% |
| bursty | 100.00% | 100.00% | 85.36% | 1.75% | 93.05% | 83.84% | 70.11% |
| overload | 100.00% | 100.00% | 38.02% | 2.16% | 89.30% | 77.46% | 53.27% |

### What this means

1. **White-box lookahead is perfect** because the code reveals the policy. Do not claim this as learned reasoning or predictive intelligence.
2. **Health+age is enough in this particular simulation** to reproduce actions even without an explicit fault flag, because the `FAULT` operation sets health to zero. This is a **visible proxy**, not discovery of an unknown state.
3. **Partial views degrade prediction**: 25% masked health/fault fields reduce top-*k* overlap to 87.39% (clean), 85.86% (sparse), 83.84% (bursty), and 77.46% (overload). Missing values are estimated from age using a deliberately simple non-trained heuristic.
4. **Unobserved faults cannot be identified:** two separate instances with identical observable cell states but differing externally asserted latent damage produce identical actions. This is an observability limit, not an implementational failure.
5. **No calibrated confidence**, conditional probability model, trained weight update, out-of-distribution detector, or learning loop exists in the current engine.

## Performance microbenchmark

Measured in the local container, one Node process, one 1,500-cycle run; no workload parallelization or storage writes:

| Metric | Result |
|---|---:|
| Average renewal call | 0.4569 ms |
| Median renewal | 0.4131 ms |
| p95 renewal | 0.7023 ms |
| p99 renewal | 0.8923 ms |
| Implied renewal throughput | 2,189 cycles/s |
| Full `VIEW` after 1,500 entries | 12.370 ms |
| Resident process memory at end | 80.51 MiB |
| Final population | 365 |

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
