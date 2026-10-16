# Seeded Cross Volume — Test Report

Test date: 2026-10-15, local execution in the ChatGPT sandbox.

## Numerical regression: 27 passed, 0 failed

`node --test engine.test.mjs`

- Preserves the 12 original head summaries, mean entropy and drift constants from the user-supplied file.
- Uses the identical derived cell projection formula already used by the 2D raster.
- 12 × 29 × 47 = exactly 16,356 finite values for each of Seeded Cross, Softmax, and Difference.
- For each mode, Solar A and Solar B pass exact Float64 round-trip preservation; a single injected cell difference rejects.
- Index/address round trips, point buffer count, isolated-head count, invalid inputs, and 180° involution pass.

## Chromium browser regression: 28 passed, 0 failed

`python browser_test.py`

Browser navigation to localhost and network/CDN imports are blocked in the test environment. The harness builds a **test-only in-memory** page from the original local JavaScript files, blocking the Three.js CDN by design; it does not modify source or the Git page. Desktop 1440 × 900, mobile 390 × 844.

For each viewport:
- 16,356 total points and original constants present.
- Renderer fallback starts without exceptions.
- Solar A accepts, Solar B accepts, one-cell fault rejects with crossing count 0, clearing the fault accepts.
- Softmax and Difference modes each accept without a fault.
- One head filters to 1,363 points; returning to all shows 16,356.
- Pause rotation, coordinate inspection and receipt UI behave correctly.

### Important limitation

The sandbox Chromium exposed a **2D perspective-projection fallback**, not WebGL. Three.js WebGL point rendering and native WebGL point rendering are implemented but **were not verified in a GPU-enabled browser during this run**. The geometry is a 3D data volume projected onto a 2D canvas when GPU access is unavailable. GitHub Pages availability also needs to be checked separately after commit.

## Scientific boundary

The user-uploaded source reports metrics from a real DistilGPT2 run, but this extension does not re-run the model or inspect individual Q/K/V weights. All 16,356 grid cell intensities are derived synthetic projections for visualization and reversible-index testing. The local JSON receipt is unsigned and cannot prove a remote server received the payload.