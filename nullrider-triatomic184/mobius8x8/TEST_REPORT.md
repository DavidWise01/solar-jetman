# NULLRIDER — 8×8 Möbius X-Swap, Node 184 — Test report

## Actual implementation

- Original user notation: `(tori d cubi a | tori d > .x. < tori d | cubi b tori d)`.
- One 8×8 grid of 64 logical addresses is transferred A→B by a reversible row/column coordinate exchange at `.x.`: `B[j][i] = A[i][j]`. A and B are two **views** of the same data, not separate 64-address source universes.
- Möbius frame view: at the end of each full 360° circuit, reverse the eight local strip positions for each row; the next full circuit restores them. The display shows a continuously rotated 3D Möbius ribbon, while the exact data-frame reversal is discrete at completed circuits.
- Spinor-sign analogy: 360° → −1, 720° → +1. The UI also displays `cos(theta/2) + i sin(theta/2)` as a continuous **illustrative** two-turn phase. Not a hardware-generated spinor wavefunction.
- Node 184 is the required application gateway on pack/swap/view/restore. The 365-slot Triatomic core, 2% renewal policy and older adaptive observer are unchanged.

## Tested

- Node.js 22: **51/51** unit tests passed for empty, one-byte, full-grid, multi-block, Unicode and long payloads across 0 to 8 completed Möbius circuits; exact coordinate exchange and inverse; spinor sign; corrupted data, metadata, block length, and padding rejection; gateway-only access.
- Chromium browser: **36/36** desktop and mobile checks passed. Tests verify the 64-address matrices on both sides, canvas rendering, exact-byte `ACCEPT`, 360° view reversal, 720° restoration, single-byte tampering `REJECT`, restored `ACCEPT`, changed text rejection until re-sealed, and reset. Browser tests inline the same module source because local navigation is restricted by the test sandbox.
- Total **87/87** unit/browser checks; no hardware or live quantum measurement.

## Important boundaries

- These are software transformations on bytes and a mathematical 3D rendering, not literal electron or quantum-computer spin dynamics. Spin-½ state vectors change sign under a 360° SU(2) rotation, but an isolated global sign is not an experimentally readable bit.
- 8×8 transpose is reversible even though it does not implement a quantum gate or actual 3D crystal-lattice surgery.
- The two Möbius ribbons are symbolic surfaces. A physically closed Möbius band is nonorientable, not a simple rotating torus. The visualization and parity rule model a 360° orientation flip, not a microscopic mechanism.
- Runtime proof is byte comparison; SHA-256 is included in local browser receipts only if Web Crypto is available. The receipts are not independently signed.
- GitHub Pages deployment is separate from test execution and may lag behind commits. The new directory does not modify any existing NULLRIDER pages.

## Reproduce

`node --test engine.test.mjs`

`python browser_test.py` (needs Playwright and Chromium)

No model weights, Railway login, external JS CDN or keys are needed.
