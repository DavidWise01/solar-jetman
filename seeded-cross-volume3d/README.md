# SEEDED CROSS — 16,356 CELL 3D VOLUME

GitHub Pages candidate: `https://davidwise01.github.io/solar-jetman/seeded-cross-volume3d/`

New standalone experiment; preserves `seeded-cross-16356/` and the original Solar Jetman home page.

- Exactly **12 head slices × 29 rows × 47 columns = 16,356 derived visualization cells**.
- Source: previously provided Seeded Cross HTML and its 16,356-cell raster, including the exact `HEADS` and per-cell projection formula. No 16,356 per-cell measurements exist in that source; the visualization must not be described as real Q/K/V values.
- Renderer: real **Three.js WebGL** points if the public CDN is available; immediate **native WebGL** fallback (and projected 2D canvas if WebGL is disabled). Three.js is fetched dynamically and may be blocked by offline browsers.
- Orbit with pointer drag; zoom with wheel; filter individual heads; inspect projected coordinate and mode; switch Seeded Cross / Softmax / Difference; view Solar A/ Solar B half-turn.
- **Preservation**: exact Float64 inverse index permutation. `row -> 28-row` and `column -> 46-column` independently inside each head, with 180-degree index reversal. `VERIFY AT 0` ACCEPT if and only if exact values recover; `INJECT ONE-CELL FAULT` produces REJECT.
- Receipt: local unsigned JSON, no server/cryptographic signature; no authenticated handoff to `0root.ai`.
- Original source reports DistilGPT2 attention findings, e.g. layer-0 summary, entropy and 100% top-token agreement. This extension does not reproduce those experiments, it only preserves supplied summary values.

Run locally from this directory:

```bash
python3 -m http.server 8765
# visit http://localhost:8765/
node --test engine.test.mjs
```

No build tool / no npm install needed. The web page requires a local HTTP server because JavaScript module imports are blocked from `file://` by some browsers.