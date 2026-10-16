# NULLRIDER — Node 184 Adaptive Phase Observatory V2

**Status:** experimental / synthetic-data only / read-only / no writes to cell state.

## Design

`{-{+{=}}}` — outer counter-rotates (-), inner advances (+), comparison at scalar-zero (=).

The sole logical gateway is `Node 184`. Physical-cell identifier 184 is distinct from that gateway. The original triatomic 365-cell controller (TACH -2 / GYRO 0 / POSI +3 / 11 shared reserve slots) is unchanged, as is the average 2% renewal quota. `7.5°` is the tolerance on **relative phase difference**, not the cell renewal budget or a direct physical angle for Planck-scale matter.

## What is new

The previous phase observer assumed the opposite-phase likelihood and could underperform badly when that assumption was false. This observer scores **three expert likelihoods on the exact same two phase observations** per cell, then chooses only on independent reference worlds with known labels:

- `PHASE_OPPOSED`: faults shift 0° and 180° readings in opposite directions
- `PHASE_INVARIANT`: faults shift the two readings in the same direction
- `BASELINE`: discard phase data and use existing independent alarm/drift posterior

On each calibration world, compare proper Brier scores to the baseline; require a normal-approximation 95%-CI **lower bound** of mean gain to exceed `0.001`, and require the opposite-phase expert to beat the invariant expert as well. This is an **illustrative conservative selection rule**, not formal coverage-guaranteed inference in arbitrary data. When evidence doesn't support either phase model, select baseline. After selection, hold **all test labels completely outside** the observer's input. Process-local policy issuance prevents a plain JSON object from impersonating calibration within one process; **not cryptographic authentication across processes**.

## Test structure

- 24 known-label calibration worlds per regime: seed `310000`–`310023`
- 100 held-out test worlds per regime: seed `460000`–`460099`
- Three simulated regimes: opposite-phase signal, no phase signal, invariant-phase signal
- 365 cells/world; 36,500 held-out cell observations/regime
- Exactly 730 recommended renewal slots across each 100-world regime (7 / 7 / 7 / 8 etc.), including at least one each from TACH/GYRO/POSI
- Stationary and rigid phase comparators receive two sensor observations per cell. The adaptive observer's two-sample **model candidates share the same exact data**, avoiding a misleading extra sensor budget.
- No actual renewals are applied. Precision counts **potentially correct selected cells** only.

## Results

See [results.json](results.json) and [heldout_worlds.csv](heldout_worlds.csv). On the fixed synthetic seed sets:

| Regime | Selected expert | Adaptive hits | Rigid opposite hits | Stationary hits | Quota |
|---|---|---:|---:|---:|---:|
| Opposed | PHASE_OPPOSED | 687 | 687 | 626 | 730 |
| Null | BASELINE | 577 | 475 | 570 | 730 |
| Invariant | PHASE_INVARIANT | 626 | 475 | 626 | 730 |

The rigid observer is correctly specified **only** in the opposite-phase regime. The adaptive observer's improvement elsewhere is model-mismatch protection under the known simulation families, not a general proof that rotation helps. Calibration labels and future sensor drift can change the outcome. No external sensor data, biological measurements, or quantum-device data were used.

## Reproduce

Requires Node.js 20+; no dependencies and no Railway account.

From the containing `nullrider-triatomic184/` directory:

```bash
node --test adaptive/adaptive.test.mjs
node --test engine.test.mjs infer/infer.test.mjs phase/phase.test.mjs adaptive/adaptive.test.mjs
node adaptive/benchmark.mjs
```

Open `adaptive/index.html` in a browser; it embeds the summary data and also links to the raw JSON/CSV files. A running webserver is not required for the page's built-in examples. Use `results.json` for independent verification.

## Limits and operational controls

1. No real-phase sensor provenance or external validation is available; the data are generated from declared Gaussian sensor models.
2. Cross-process receiver attestation, signatures, true physical air gaps and remote execution are **not** implemented here.
3. Calibration policy trust is process-local; before use with remote systems, sign and verify the serialized calibration bundle.
4. The core's existing auto-renewal policy is unchanged. No recommendation is automatically applied, and false positives remain possible.
5. Rotation is a geometric representation: no evidence of quantum/subquantum sensing or physical time dilation is claimed.
6. Results reflect 24 calibration worlds and a fixed 100-world held-out cohort; broader simulation families and empirical data are required for deployment decisions.
