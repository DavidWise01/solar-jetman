# NULLRIDER — Node 184 counter-rotating inference A/B experiment

**Status:** REPRODUCIBLE SYNTHETIC EXPERIMENT; not physical sensor data, not quantum hardware.

## Question
Does an observer that samples a fault-sensitive signal at two different allowed phase orientations outperform a stationary observer that samples the same orientation twice, while preserving the same Node 184 access boundary, the same two sensor samples per cell and the same approximate 2% (exact average) selection budget?

## System held constant

- 365 slots = 118 TACH (-2) + 118 GYRO (0) + 118 POSI (+3) + 11 RESERVE.
- Single software gateway: Node 184. Inference is read-only; existing core and 2% renewal controller are unchanged.
- Baseline age/band prior and `alarm`, `drift` sensors from `../infer/infer.mjs` and `../infer/synthetic.mjs`.
- 100 paired independent world seeds (`271840`–`271939`); 36,500 total cell observations; 25% independent masking of each base sensor.
- Phase samples per cell: 2 in both arms. Common random background and noise generated from identical deterministic seeds; only the second sample's fault-dependent phase response is changed.
- Stationary sample angles: (0°, 0°). Spinning sample angles: (0°, 180°).
- Counterrotation uses inner +phi and outer -phi, with a relative-phase gate of +/- 7.5 degrees, aligned at phi=0°, 180°.
- Exactly 2% average scheduling budget by integer carry: 7,7,7,8,7,7,8,7,7,8 (73 selections in ten independent cycles).
- Same selection rule in both arms, reserving one slot from each TACH, GYRO and POSI before filling the quota by estimated fault probability.

## Synthetic sensor model

For hidden binary fault y in {0,1}, shared unknown background b ~ N(0,1.1^2), independent noise eps ~ N(0,0.6^2), and assumed fault-sensitive amplitude a=0.6:

- x0 = b + a*y + eps0
- stationary x1 = b + a*y + eps1
- rotating x1 = b - a*y + eps1

The observer sees only age, band, masked base sensors, x0 and x1, **never y**. It uses the analytically specified bivariate Gaussian likelihood ratio to update the existing Node184 posterior. Its assumptions match the synthetic generator in the main experiment. Those assumptions are not independently measured or calibrated.

## Results (100 paired worlds)

| Measure | Stationary | Counter-rotating |
|---|---:|---:|
| Brier score (lower better) | 0.05428 | 0.04243 |
| 2% budget: chosen slots | 730 | 730 |
| True faults among selected | 608 | 695 |
| Selection precision | 83.29% | 95.21% |
| Selection recall among 3,507 hidden faults | 17.34% | 19.82% |

Paired 95% approximate CI for Brier-score improvement (stationary - spinning): 0.01085 to 0.01285. A 100-scenario dataset with repeated independent worlds is not a model-trained test; conclusions remain entirely within the declared synthetic generator.

### Critical controls

- **No phase-dependent information** (`a=0`): both methods had Brier 0.05630 and selected 635 true faults per 800 fixed top-8 picks; **zero benefit**.
- **Assumption violation** (fault-dependent signal does **not** reverse at 180°): stationary Brier 0.05428, rotating Brier **0.06946**; rotating selects **fewer** true faults. An incorrect rotation model can harm inference.
- 365/365 cells remained present in every trial. Neither inference arm invokes `RENEW`; these results rank hypothetical maintenance targets only.
- Node tests reject wrong gateway, non-INFER operations, label leaks, invalid phase windows, malformed phase pairs and duplicates. No signatures or physical apparatus are involved.

## Reproduce

Requires Node.js 20+; no npm packages or Railway login:

```bash
node --test nullrider-triatomic184/infer/infer.test.mjs nullrider-triatomic184/phase/phase.test.mjs
node nullrider-triatomic184/phase/benchmark.mjs
```

The benchmark outputs `phase/results.json` and `phase/worlds.csv`. The 7.5° tolerance is a **relative-phase** threshold: with two equal, opposite angular speeds, the angular access duty cycle is 4.1667% of a full revolution (two 7.5°-wide phase windows). It is not the 2% renewal quota.

## Boundaries

This does **not** prove counter-rotating toroids reveal hidden physical data, improve real medical/atomic fault detection, or create quantum information. The phase-fault relationship is a designed *synthetic hypothesis*. The result describes exactly when the hypothetical differential measurement helps and when it fails. For the next credible upgrade, first acquire real repeated measurements at known orientations, estimate phase-dependent likelihoods on calibration data, and test against separate held-out observations.
