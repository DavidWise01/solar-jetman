# NULLRIDER — Möbius 8×8 X-Swap / Node 184

## Corrected notation

```
(tori d cubi a | tori d > .x. < tori d | cubi b tori d)
                         8 × 8 SWAP
```

The prior adaptive phase model observed two counter-rotating rings. The corrected model is a **64-address (8×8) reversible coordinate exchange at .x.**, pictured on Möbius strips. It does not create 128 unique logical addresses. It maps A[i,j] to B[j,i] (transpose, its own inverse). One 360° circuit reverses the **local frame orientation**, and the spin-½ **spinor sign** is −1; two circuits (720°) restore frame and spinor sign +1. A quantum spinor is a mathematical transformation law, **not** a tiny classical object physically spinning along a Möbius surface. A global spinor sign cannot be measured in isolation.

This is a conceptual/engineering analogy—not an implementation of literal electrons, Planck bubbles or quantum gates.

## Preservation & state

- `engine.mjs` packages arbitrary UTF-8 bytes into zero-padded 64-byte blocks, preserves their length, transposes them at `.x.`, applies a view-only 360° Möbius reversal, then reverses both transformations and compares exact original bytes.
- `engine.test.mjs` tests 51 scenarios including 360°/720° closure, incomplete blocks, non-ASCII cargo, fault rejection, corrupted metadata, exact gate requirement and preservation.
- `index.html` / `app.mjs` are an interactive standalone GitHub Pages site with **native canvas perspective 3D**, not Three.js or an experimental quantum simulator. Drag-free angle slider, continuous cruise, 360°, 720°, matrices, a strict-byte `ACCEPT`/`REJECT` seam and an injected B fault.
- **All logical transfer actions require Node 184.** Logical gateway 184 is distinct from physical cell address 184 in the preexisting 365-cell Triatomic registry.
- Triatomic 118×3+11=365, 2% scheduled renewal, and the existing inference modules are not rewritten or affected by this stand-alone experiment.
- SHA-256 appears in browser receipts only in a secure browsing context; plaintext hashes are omitted in insecure contexts. Local receipts are not signed and are not evidence of remote exchange.

## Run

Open `index.html` in a modern browser that supports ES modules. For module loading from a local folder, host it with `python -m http.server 8000` (then visit `http://localhost:8000`). On GitHub Pages it loads as a static site without a server-side component or Railway.

Run tests: `node --test engine.test.mjs` using Node.js 22+.
