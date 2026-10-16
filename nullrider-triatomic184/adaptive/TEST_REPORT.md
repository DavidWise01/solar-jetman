# Node184 Adaptive Phase V2 — verification

- Test suite: `adaptive/adaptive.test.mjs`, 20/20 PASS.
- Independent benchmark: 24 labeled calibration worlds + 100 disjoint held-out worlds per regime.
- Same 2% quota (730 total candidate slots), same 365 cell addresses, same hidden truth in matched test seeds.
- Three regimes: phase-opposed, null phase and phase-invariant.
- Inferred models respectively PHASE_OPPOSED, BASELINE, PHASE_INVARIANT.
- Correct hit totals respectively 687/730, 577/730, 626/730, versus rigid 687, 475, 475.
- Core state fingerprint and occupancy remain unchanged in all 300 held-out worlds.
- Gate-only inference, fault/truth-injection rejection, no-repeat calibration seeds, process-local minted policies and budget/branch fairness tested.
- Chromium desktop and mobile in-memory browser checked: all scenario switches, control responses, zero horizontal overflow, no JS page errors.
- No real Q/K/V, chemical, atomic or quantum sensor measurements are involved.
- Measurement comparison does not imply rotation creates information; it only helps when the physical or synthetic sensor actually responds to orientation.
