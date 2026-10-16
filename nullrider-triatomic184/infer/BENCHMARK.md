# Node 184 read-only INFER — measured synthetic benchmark

Date: October 16, 2026. Forty independent simulator seeds, 365 cells per world; original homeostasis engine unchanged.
All fault labels hidden from inference. Two noisy conditionally independent synthetic sensor readings per cell. Model matches the simulator assumptions.

| Missing sensor probability | Decided coverage | Alert precision | Alert recall | Brier | Prior-only Brier | Both missing |
|---:|---:|---:|---:|---:|---:|---:|
| 0.0% | 81.7% | 82.6% | 17.7% | 0.0463 | 0.0875 | 0 |
| 25.0% | 75.8% | 81.9% | 10.2% | 0.0538 | 0.0865 | 930 |
| 50.0% | 60.3% | 82.3% | 4.6% | 0.0592 | 0.0862 | 3,668 |
| 100.0% | 0.0% | — | 0.0% | — | — | 14,600 |

A lower Brier score is better. Full observation of synthetic sensor **values** does not imply all ground-truth faults are known. With 25% missing, alert recall is only ~10%; the system must not be described as detecting all faulty cells.

Tests: 15 observer/simulator Node tests + 8 unchanged original engine tests; 44 desktop/mobile browser checks. All passed locally. The numeric benchmark is synthetic, not measured on physical devices.

The benchmarking command writes `results.json` and `results.csv`. The browser can export its own JSON after RUN HOLDOUT.

Physical quantum computing, Planck bubbles, biological homeostasis, AI training, and probability calibration to a real-world sensor are **not** demonstrated.
