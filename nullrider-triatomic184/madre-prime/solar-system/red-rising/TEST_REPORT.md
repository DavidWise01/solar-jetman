# NULLRIDER — Madre Prime / Red Rising Iron Gold overlay: test report

- **Build:** one real Sun, 8 physical planets, 14 *fictional* Colors; book-four *Iron Gold* (~753 PCE) overlay.
- **Status:** ADDITIVE, read-only. One shared observatory facade through logical Node 184.
- **Original physical model:** 74 entries; solar flux 1/r^2 and eight illustrative solar phase bins, 729 units per symbolic diatom division event.
- **Chemical meaning:** Fe = iron atomic number 26; Au = gold atomic number 79, independent elements. Iron Gold denotes a fictional Gold-conqueror ideal and book title; "Apex Prime" is user's symbolic label.
- **Tests:** 19/19 new Node tests; 38/38 Chromium desktop/mobile UI checks; 104/104 combined Node regression including the existing core, Möbius, Madre, solar and overlay modules.
- **Integrity:** Fiction planet selection cannot change the physical simulation inputs, core operations denied by overlay, wrong Node 184 gate denied, initial core fingerprint unchanged on read-only calls.
- **Caveats:** Mercury is contested in book four; Uranus and Neptune are unassigned instead of fabricated. The fictional world map is simplified and non-spoiler-comprehensive.
- **Source trust:** Story source is the publisher and secondary lore pages; baseline astronomy/biology citations are in ../README.md. No live data. Neither human hierarchy nor fictional gene tailoring is real-world science.

Run from `nullrider_triatomic184/`:

```sh
node --test engine.test.mjs mobius8x8/engine.test.mjs madre-prime/madre.test.mjs madre-prime/node-adaptive.test.mjs madre-prime/solar-system/solar.test.mjs madre-prime/solar-system/red-rising/overlay.test.mjs
python madre-prime/solar-system/red-rising/browser_test.py
```
