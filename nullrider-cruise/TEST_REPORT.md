# NULLRIDER CRUISE — verification report

## October 16, 2026

- `node --test engine.test.mjs cruise.test.mjs` — **143 passed / 0 failed** (23 inherited dual-solar engine checks and 120 cruise checks).
- `python browser_test.py` — **42 passed / 0 failed**, 21 desktop + 21 mobile browser checks.
- Checks include all three time/engine pairings, fixed scalar zero, 208-address bounds, shell 31 310°/50° complementary angles, full 16,356 display geometry count, lane determinism, immutable context snapshot, byte preservation for Unicode cargo, one seam crossing, fault injection with no crossing, reset and rendered controls.
- Browser runtime validated by an in-memory HTML/module harness because the execution environment blocks navigation to locally served URLs. The test copy uses real Python hashlib SHA-256 and a test-only transaction ID rather than browser secure-origin primitives. Production source continues to use native `crypto.subtle` and `crypto.randomUUID` on secure origins.
- Chromium here used canvas fallback. Live Three.js WebGL rendering on GitHub Pages is **not independently tested**.
- This is a reproducible symbolic experiment, not proof of a Planck-scale mechanism, physical time dilation, real quantum hardware access, independent hosted receiver or verified 16,356 Q/K/V data.
- Default GitHub Pages path planned: `https://davidwise01.github.io/solar-jetman/nullrider-cruise/`; live hosting status requires separate check.
