# NULLRIDER TRIATOMIC / NODE 184 — test report

Date: 2026-10-16. Scope: deterministic software demonstration, not quantum or biological experiment.

## Results

- Node built-in tests: **8/8 passed** (`node --test engine.test.mjs`).
- Chromium browser integration checks: **44/44 passed** across desktop 1440×920 and mobile 390×844, including changing the automatic renewal control, injecting/removing a targeted fault, preserving occupancy, timing the 7.3-cell fractional quota, viewing cell 184, reset/ledger continuation, and ensuring no horizontal mobile overflow.
- No network access, external model, live 0root.ai receiver, or real-world 365-cell sample was required.

## Measured simulator invariants

- Total positions: `118+118+118+11=365`.
- Through Node 184, every `RENEW` retires and replenishes exactly the same integer number of positions.
- Each of the three 118-slot bands contributes at least one replacement per cycle.
- Deterministic integer quota: 73/10 and 730/100 cycles, exactly 2.000% *average replacements per address per cycle*.
- One injected `FAULT` on cell 184 is prioritized for renewal and clears from the state after the next cycle.
- Replaying an accepted mutation transaction ID is rejected, including after `RESEED`.
- Unknown operations and wrong gate IDs are rejected; application snapshots are copies.
- Ledger is append-only within the current runtime, but is not persisted beyond page refresh.

## Boundaries

- The plotted branches are a JavaScript canvas **perspective depiction**, not measured electron orbitals or true volumetric Three.js.
- Occupancy can remain 100% while a fault is present. `STABLE` depends on tracked fault/health flags and should not be mistaken for experimental biological homeostasis.
- `184` gateway label does not constitute a cryptographic identity or authorization barrier: callers with in-browser script access can make their own permitted gateway calls.
- Receipts are unsigned and use a noncryptographic fingerprint; the app does not assert proof of source authorship, physical access to matter, quantum advantage, or Planck-scale behavior.
