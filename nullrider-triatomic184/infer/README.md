# NULLRIDER — Node 184 read-only INFER v1

## One gateway, a new operation

This is an **additive experiment** beneath `nullrider-triatomic184/infer/`. The tested original Node 184 homeostasis engine, `../engine.mjs`, is **unchanged**. INFER is a new read-only observer interface that only accepts `via:184`, `op:'INFER'`, and a sanitized list of noisy sensor records. It has no reference to the engine's private cell state or its mutation closure.

- Registry remains **3 × 118 + 11 = 365 cells** with Tach `−2`, Gyro `0`, Posi `+3` and eleven shared reserve slots.
- Scalar zero, the symbolic 7.5° aperture and the 2% renewal quota stay independent. An INFER call does **not** renew or reprogram any cell.
- Wrong gateways, malformed sensors, duplicate cell IDs and forbidden labels such as `fault`, `health`, `truth`, and `target` are rejected by the observer.
- The receiver preserves the *actual original* snapshot fingerprint, event count and cycle before and after predictions.
- The observer can say **ALERT**, **CLEAR**, or **ABSTAIN**. If both sensors are absent, it must abstain and report an unknown posterior.
- Before inference, the laboratory seals the true fault labels. Click **REVEAL TEST LABELS** only when you want to score your predictions.

## Inference mechanics

A small Bayesian rule updates an age-and-branch prior using two conditionally independent **synthetic** binary signals:

| Model assumption | Alarm | Drift |
|---|---:|---:|
| Sensitivity when damaged | 0.82 | 0.70 |
| False-positive rate when healthy | 0.09 | 0.20 |

The prior is `0.07 + 0.16×clamp(age,0,50)/50 + 0.025` for reserve cells (with upper/lower bounds). Each sensor is independently missing with the selected fraction; data missingness is assumed independent of faults. These likelihoods are intentionally known to the simulator; **nothing has been learned from real-world cells**. The default decision policy is ALERT for posterior ≥ 0.80, CLEAR for posterior ≤ 0.08, and ABSTAIN otherwise. These are *assumed-model probabilities*, not empirical clinical/physical confidence estimates.

## Reproducing locally

Run the standalone `index.html` in a browser, or:

```bash
node --test ../engine.test.mjs infer.test.mjs
node benchmark.mjs
python build.py
python browser_test.py
```

The desktop/mobile test uses in-memory HTML injection so it requires neither a web server nor Railway. The application uses no external CDNs, APIs, uploaded files, private signing keys or network access.

## Truth and data partitioning

A seeded synthetic generator instantiates the 365-cell controller using `createTriatomic184()`. Every generated fault is injected **through Node 184**. The test harness retains truth labels. Before a prediction, the INFER interface receives only `{id,band,age,alarm,drift}`. It cannot inspect the truth or engine's `VIEW` response. Benchmarks use independent seed values 20801–20840. There is **no training phase**, so “held-out” here means test worlds not supplied to an optimization process, not a demonstration of generalization to real hardware.

The benchmark compares Brier score with a prior-only predictor. It also reports coverage, precision, and recall. Selective decision accuracy is not the same thing as fault-detection recall: the conservative observer often abstains and can miss most real faults.

## Limitations

- No pretrained attention weights, quantum measurements, actual Planck-scale cell, electronics telemetry or biology are used.
- Data are fully synthetic and purposely generated from the model's own assumptions, so real-world performance is unknown.
- The observer does not guess hidden faults if there are no observations. It is an inference *prototype*, not a general AI agent.
- The existing 2% renewal controller is not rewritten, retrained or automatically driven by probabilistic inferences.
- The current receipts are local, not cryptographically signed or cross-host verified.

Original Node184 engine and earlier NULLRIDER pages remain untouched.
