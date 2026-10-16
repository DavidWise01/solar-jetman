# NULLRIDER — MADRE PRIME TOWER 366 / 3

**Experimental symbolic software system.** This integrates the existing Node 184 triatomic controller, 8×8 Möbius reversible byte exchange, Bayesian inference observer, and (Node.js only) the adaptive phase calibrator. It does not simulate real electrons, string-theory geometry, or Planck foam.

## Corrected source-of-truth: `366 / 3 = 122`

The Madre Prime register comprises **366 tower positions in three equal branches of 122**. Each branch maps:

- 118 existing triatomic cells (TACH −2, GYRO 0, POSI +3)
- four structural positions, **twelve total**. Eleven are existing shared reserve cells; the remaining one is a fixed scalar-zero anchor with **no physical core cell ID**.

Thus **354 original triatomic + 11 original reserve = 365 operational cells**, plus **one pinned scalar-zero tower position = 366 addresses**. This is an *integration address map*, not a claim that a physical atom contains 366 shells. The scalar anchor is at tower address 366 in the mapping and is not retired or replenished. The user’s primary rule is `366 / 3`, not a separate 365-cell tower with an extra arbitrary block.

**Crucial:** *logical gateway Node 184*, *core cell ID 184*, and *tower address 184* are different identifiers. All interface operations use `via:184`. The bridge currently maps tower address 184 to core cell 180, and core cell 184 to tower address 188. Gateway Node 184 is not a physical slot.

### Immutable Madre notation

- `MNP :: MADRE PRIME :: base 366`
- Seven spire rings, exact sequence: `66 / 36 / 6 / 6 / 3 / 1 / 1`. These labels are **not** treated as portions of 366; their sum is 119, not 366.
- Odd toroids: `{{1x1}}^1`, `{{3x3}}^3`, `{{5x5}}^5`.
- Even cubi: `{{2x2}}^2`, `{{4x4}}^4`, `{{6x6}}^6`.
- Three spatial axes, six signed directions (`±x, ±y, ±z`), one open origin with open through-hole; linear time remains separate.
- Time positions `-1 / 0 / +1`; engine positions Tach `-2`, Gyro `0`, Posi `+3`.
- `7.5°` port marker is an angle marker and **not** the 2% cell renewal budget.

## Connected modules

| Source | Integration | Boundary |
|---|---|---|
| `../engine.mjs` | `RENEW`, `FAULT`, `VIEW`, `RESEED` | All via Node 184; original 365-cell scheduler remains unchanged |
| `../mobius8x8/engine.mjs` | `PREVIEW`, `SWAP` | 8×8 transpose at `.x.`, symbolic 360° reversal and 720° closure, exact-byte check; PREVIEW has no crossing |
| `../infer/infer.mjs` | `INFER` | Read-only posterior; dashboard uses **internally derived proxy observations** and makes no real sensor claims |
| `../adaptive/adaptive.mjs` | Node-only `CALIBRATE_ADAPTIVE`, `INFER_ADAPTIVE` | Requires independent labeled reference worlds; process-local policy; not a browser feature |
| `../phase/phase.mjs` | Existing referenced phase expert via adaptive module | Synthetic models only; no real sensors |

`VIEW`, `AUDIT`, `LOCATE`, `CELL_ADDRESS` are read-only operations. `SWAP` checks preservation and records a local unsigned receipt only after user launch; it never alters the triatomic cells. The 2% renewal works exactly as before: 73 slot replacements per ten cycles, full population 365/365. Inference never initiates renewal.

## Try it

[GitHub Pages cockpit](https://davidwise01.github.io/solar-jetman/nullrider-triatomic184/madre-prime/) (deployment status should be checked separately). The page is a static ES-module application using dependency-free perspective canvas rendering; it does not require Three.js or Railway.

To open locally, host the repository root with a basic static server (ES modules often do not run on `file://`):

```bash
cd solar-jetman
python -m http.server 8000
# open http://localhost:8000/nullrider-triatomic184/madre-prime/
```

Run Node integration tests from `nullrider-triatomic184`:

```bash
node --test madre-prime/madre.test.mjs madre-prime/node-adaptive.test.mjs
```

With Python Playwright + Chromium installed, run `python madre-prime/browser_test.py` from the same directory; the harness uses an in-memory module bundle and does not require network access.

## Safety / interpretation

- These are symbolic information-processing and software fault-recovery mechanisms, **not** physical quantum processors, electrons, or Planck bubbles.
- 360°/720° sign change is a symbolic representation of spinor transformation behavior; standalone global sign is not directly measurable.
- Möbius renderer uses projected geometry; actual serialized swap is a byte-exact 8×8 transpose with reversible view transform.
- Receipts are local and unsigned. No remote transport to `0root.ai` is made here.
- Avoid conflating the core's proxy-derived inference observations with independent real sensor data.
