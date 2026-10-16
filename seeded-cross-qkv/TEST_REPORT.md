# SEEDED CROSS Q/K/V IMPORT — TEST REPORT

- **Numerical Node tests:** 28/28 passed. Includes Q/K causal-softmax reconstruction, 12×N×64 dimensional checks, normalization, future-token masking, 16,356 raster cells, A/B 180-degree exact preservation, one-cell corruption rejection, head filters, malformed/tampered imports, and declared-provenance limitations.
- **Browser interaction tests:** 26/26 passed (13 each at 1280×900 desktop and 390×844 mobile). Includes empty initial state, opt-in synthetic demo, explicit origin label, raster and native data counts, accept/reject after 180-degree reversal, restore, Q/K and V display fields, per-head filtering, and zero unhandled page errors.
- **Overall:** 54/54 checks passed.
- **Browser environment:** in-memory module-equivalent execution and canvas fallback because sandbox prevents `file://` and routed-origin navigation; native WebGL/Three.js path not verified here.
- **Real-model benchmark:** **NOT RUN**. DistilGPT2 weights not cached; DNS/network access to Hugging Face blocked, Transformers not installed. The exporter is source-inspected and Python-syntax checked, but no valid trained-model JSON was produced in this environment.
- **Attestation:** imported JSON is validated for mathematical consistency; it is not source-authenticated. Browser copy receipt is not signed.
- **Scope:** 16,356 points are *mapped/resampled*, not 16,356 independent forward-pass measurements; Seeded Cross attention is not recomputed.