# NULLRIDER — Triatomic Node 184 homeostasis (experimental)

A browser-only, standalone visualization and deterministic model of 365 symbolic cell addresses, routed through a single software API called **Node 184**. It extends NULLRIDER scalar-zero cruising without overwriting the original page.

## Geometry / addresses

- Exactly `3 × 118 + 11 = 365` addresses: Tach `−2` (118), Gyro `0` (118), Posi `+3` (118), and 11 shared reserve slots.
- The temporal coordinates stay `past −1, present 0, future +1`, distinct from engine `−2, 0, +3`.
- `184` is the **gateway address in the symbolic 208 register**. `cell 184` is a different address, within the 365-cell register. It happens to live in the Gyro band at slot 66.
- The 7.5-degree aperture represents `7.5/360 ≈ 2.0833%` of a turn. It is not the maintenance quota: the maintenance quota is exactly 2% in a ten-cycle average.
- No physical atomic electron shell, Planck-bubble dynamics, or quantum hardware behavior is asserted by these virtual address slots. Element 118 is Og (oganesson); the extra eleven registers are not eleven chlorine atoms.

## Gateway-only API

The engine closure exports `createTriatomic184()`, which returns **only** `through184(packet)`. There is no mutable `cells` export.

```js
import {createTriatomic184} from './engine.mjs';
const core = createTriatomic184();
const initial = core.through184({via:184,op:'VIEW'});
const cycle1  = core.through184({via:184,op:'RENEW',tx:'run-1'});
const fault   = core.through184({via:184,op:'FAULT',tx:'fault-1',cell:184});
const cycle2  = core.through184({via:184,op:'RENEW',tx:'run-2'});
```

`VIEW`, `RENEW`, `FAULT`, `RESEED` are the only supported operations. Wrong gateway, duplicate transaction IDs, invalid cell IDs, and unknown operations are rejected. Views return defensive copies. `RESEED` preserves the append-only in-memory receipt log and the replay set.

## Renewal semantics

`quota=7` plus fractional tenths carry `+3` each cycle. Every ten cycles there are exactly `73` replacements (seven cycles of seven, three cycles of eight); every hundred cycles, `730` replacements. During each renewal, live cells age, the three named branches contribute at least one replacement, and remaining slots are chosen by risk/age ranking. Faulty cells are prioritized. Retired versions are logged, new versions fill the exact same positions. Population remains 365.

In this toy model, `STABLE` requires full occupancy and zero remaining faults/low-health cells. It is **not** an empirical biological or physical stability metric. The local ledger is lost on page refresh. Fingerprints are 32-bit noncryptographic FNV-like state indicators—not secure proofs of origin, nor authenticated cross-process receipts.

## Run

Open `index.html` as a local browser file. It is standalone: no CDN, server, npm, account, or signing key is necessary. The cockpit uses animated perspective canvas; it is not the earlier Three.js WebGL scene.

Use `RENEW 1 CYCLE`, `CRUISE 10`, or `RUN 90`; optionally turn on `AUTO RENEW` (off by default). Press `FAULT CELL 184` to show the maintenance repair path. `RESEED THROUGH 184` resets the simulation state but never erases the current session's event log. `PAUSE` halts motion and automatic renewal.

## Reproduce checks

```bash
node --test engine.test.mjs
python browser_test.py  # playwright and Chromium required
```

The browser test runs on `page.set_content()` without local network access and uses no cryptographic bridge because the simulator doesn't claim signed receipts. The engine test checks gateway isolation, deterministic 2% quota, data isolation, replay rejection, targeted fault repair, and lineage.

The source of truth for editable development is `engine.mjs`, `app.js` and `index.template.html`; run `python build.py` to compile the standalone HTML. `index.html` is the generated GitHub Pages entry point.
