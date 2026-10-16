# NULLRIDER — DUAL SOLAR | Interactive Three.js Page

**Source identity:** `github.com/DavidWise01/solar-jetman`  
**Destination identity (concept only):** `0root.ai`  
**Target GitHub Pages path:** `/solar-jetman/dual-solar/`

A standalone visualization of the tested dual-Solar preservation hypothesis. The browser computes **real SHA-256** over the exact UTF-8 bytes and performs a round-robin package/unpackage sequence for both branches. It uses Three.js for the 3D interface and a canvas fallback when the CDN or WebGL is unavailable.

- Solar A / LEFT: `0°`, widths `[16,8,4,4]`, labeled shells `16 → 8 → 4 → 2×2`
- Solar B / RIGHT: `180°`, widths `[8,4,4]`, labeled shells `8 → 4 → 2×2`
- Both branches restore their original bytes before the `0` seam is permitted to show ACCEPT.
- `INJECT FAULT` corrupts the first B byte *before* sealing and must show REJECT with `0` crossings.
- `LAUNCH RENDEZVOUS` must show ACCEPT with `1` crossing, including UTF-8 non-ASCII payloads.
- `COPY JSON` copies a **browser-local unsigned result**. No signing keys are embedded in this page.

## Files

- `index.html` — accessible responsive dashboard
- `app.mjs` — controls, simulation sequence and receipt UI
- `engine.mjs` — deterministic nested shells, inverse unwrapping and SHA-256
- `scene.mjs` — Three.js 3D assemblies and canvas fallback
- `engine.test.mjs` — 23 Node.js regression tests

## Run locally

Serve this directory with any static HTTP server. Example:

```sh
python -m http.server 8080
# browse http://localhost:8080/
node --test engine.test.mjs
```

The runtime uses an exact pinned Three.js ESM CDN URL `three@0.164.1` and does not depend on a build tool. If offline, a 2D canvas representation takes over while the data engine still works.

## Explicit boundary

This is a **visual browser experiment**, not an actual zero-point-energy machine, physical air gap, proof of solar preservation, or a networked receiver on `0root.ai`. It is also not the Ed25519-authenticated V2 Node receiver: browser results are intentionally labeled *unsigned*. The ordered tokens `/2/1/1` and `×2/1/1` remain symbolic and are **not** evaluated as arithmetic.

The prior V0/V1/V2 files and root `index.html` are deliberately left untouched. The new page occupies only its own `dual-solar/` directory.
