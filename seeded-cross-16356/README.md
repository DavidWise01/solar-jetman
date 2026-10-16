# SEEDED CROSS — 16,356-cell visualization grid

Extends the user's uploaded `index(20261016-014210).html` **without replacing it**.

## Exact dimensions

- 12 attention-head slices
- 29 logical rows × 47 logical columns per slice = 1,363 cells
- Total: **12 × 29 × 47 = 16,356 unique logical cells**
- A 180° half-turn maps (head, r, c) to (head, 28-r, 46-c). Two half-turns reconstruct every Float64 cell exactly.

## Honest data boundary

The original uploaded page embeds 12 per-head top-token weights and aggregate attention metrics for a 10-token DistilGPT2 prompt. It does **not** embed full Q/K/V data. All 16,356 colored cells are **deterministic derived visualization samples**, not measured attention weights or improved model predictions. No external libraries or server required. The existing metrics and WebGL view have been left unchanged.

## How to use

Open `SEEDED_CROSS_GRID_16356.html` in a browser. Switch `Softmax`, `Seeded Cross`, and `Cross − softmax`; switch between Solar A 0° and Solar B 180°; hover a cell for its logical coordinate and source head, then press `VERIFY MIRROR` to test full-lattice reversal. Press `INJECT FAULT` to alter one derived cell; verification will reject it until you clear the fault.

## Next scientific milestone

Capture complete attention tensors from a reproducible DistilGPT2 run, then choose whether the 16,356 cells are attention entries, latent states, or an independent simulation lattice; otherwise 29×47 per head must not be claimed as a native self-attention matrix (which is N×N for a self-attention layer).

## Test status

Chromium desktop and mobile: 22/22 browser checks passed (native `file://` navigation blocked by sandbox policy; page content mounted directly for the test). Existing WebGL entropy surface was unavailable in the test environment and displayed the original explicit error, with 2D dashboard still functional. The grid uses ordinary Canvas2D and remains operational without WebGL.