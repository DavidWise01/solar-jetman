# MADRE PRIME / Node 184 — Our Solar System Influence Observatory

**Status:** additive, read-only, educational/software demonstration. Not a calibrated solar model, N-body numerical integrator, radiation dosimeter, diatom population forecast, evolutionary predictor, or quantum experiment.

## User scope and preserved structure

This module covers the major pathways and representative minor objects/processes **within our one Solar System**, not other stars or the entire universe. The only explicitly extra-solar entries are galactic cosmic rays/interstellar conditions, marked **EXTERNAL ORIGIN** because they enter and are filtered by the heliosphere. We do not claim this finite catalog lists every asteroid, moon, small-body orbital resonance or biochemical reaction.

The project reuses the current `madre-prime/madre.mjs` untouched through `bridge.mjs`:
- 366 tower addresses / 3 branches = **122 per branch**.
- Underlying 365 operational slots = 3 × 118 ordinary slots + 11 reserve cells, plus one **non-renewable scalar-zero anchor** = 366 mapped tower positions.
- Tach −2 / Gyro 0 / Posi +3; existing Möbius 8 × 8 transfer and the original 2% renewal rule remain unchanged.
- `createSolarMadre184().through184({via:184,op:'SOLAR_VIEW',...})` performs read-only observation. Existing Madre `VIEW`, `AUDIT`, `LOCATE`, `SWAP` and operational commands remain delegated without changes. A numeric JavaScript gateway is **not security authentication**.
- `{{ H :: O :: N :: E :: Y }}` is the user's symbolic HONEY mapping; electrum and the yellow Sun are **not additional elements on the periodic table**.

## Catalog

`solar.mjs` provides **74 entries** in nine groups: Sun, all 8 planets, the 5 IAU-recognized dwarf planets, moons, small bodies, Earth filters, heliospheric/external boundary, diatom processes and observation conventions. Every entry records a major/minor qualitative tier, causal pathway and scope. **Major/minor is explanatory importance, not measured effect size.** Pluto was reclassified; it did not leave the Solar System.

### The causal stack

1. **Source:** Solar core pp-chain fusion dominates energy. CNO fusion is minor in today's Sun. Fission and trace decay are negligible as solar power sources. The Sun loses mass yet gradually becomes more luminous.
2. **Spectrum:** Solar optical/IR, UV, high-energy electromagnetic bursts, particles and neutrinos are different outputs. Brightness by itself does not determine peak wavelength or UVB dose.
3. **Transport:** Inverse-square dilution with heliocentric distance; interplanetary magnetic fields, solar wind and heliospheric modulation of external cosmic rays.
4. **Orbit & habitat:** Eight planets and their long-range gravity; Jupiter/Saturn shape secular orbital evolution. The Moon drives tides. Axial tilt, rotation, eccentricity and precession redistribute solar energy; atmosphere, ozone, water, clouds, aerosols and ocean currents filter the received environment.
5. **Biology:** Photon access plus carbon, dissolved silica, nitrogen, phosphorus, iron and tolerable conditions; DNA damage, repair, inherited mutations, reproduction and selection remain separate biological outcomes.

### Eight bins are one Sun

The eight UI bins represent **symbolic sampling positions** across an illustrative 11-year solar activity cycle. They are **not eight stars**, **not eight main-sequence fusion phases**, and **not eight measured equal-duration solar states**. Solar magnetic polarity has a ~22-year full cycle; sunspots recur on ~11-year intervals. Solar total irradiance varies by roughly **0.1% peak-to-trough** across the activity cycle, while some UV bands vary more. We use a simple cosine at eight bins as an explanatory device, not NASA measurements.

## Toy math (explicitly not biological calibration)

- Reference top-of-atmosphere solar irradiance at 1 AU: **1361 W/m²** approximate. `F(r, phase)=1361 × (1 + 0.0005cos(2πphase/8)) / r²`. This supplies the inverse-square law and an **illustrative** 0.1%-span solar cycle modulation. It does not include latitude, longitude, diurnal exposure, exact eccentricity or spectral radiative transfer.
- Illustrative underwater PAR: `F × 0.43 × surfaceLightTransmission × exp(-kPAR × depthMeters)`. The 0.43 factor is an approximate spectrum fraction. It is not species-specific photosynthetic assimilation.
- Relative UVB exposure proxy: `(1+0.25cos(2πphase/8)) × userUVBLevel × ozoneLikeTransmission × r^-2 × exp(-kUVB × depth)`. The 25% swing and transmission coefficient are **arbitrary interface assumptions**, not solar UV telemetry. UVB proxy is **not a mutation count, probability, absorbed dose, or universal DNA damage rate**.
- Symbolic diatom material quota: `(3×3)^3 = 729` bookkeeping units per division event, with two daughters; `8×729=5832` if eight such quota blocks are available. Real daughter biomasses and silica masses are not defined as 729. A UI-only threshold of 25 W/m² illustrative PAR and minimum nutrient fraction 0.2 are arbitrary; they test software resource gating, not ecological reproduction.
- Diatom reality: mitotic division produces two daughters; each inherits part of the frustule and synthesizes a new silica valve. In many species, cell size decreases over repeated divisions; sexual cycles/auxospores can restore size. Unlike a naive Fibonacci recurrence, actual growth is gated by resources, maturity, mortality, stress, predation and species-specific reproduction.
- Calendar 365/366 represents a **Gregorian leap convention** (with 100/400-year exceptions); not a physically determined diatom waking interval.

## Scientific sources (first-party/primary where possible)

- NASA Solar System inventory, eight planets / five dwarfs: https://science.nasa.gov/solar-system/solar-system-facts/ and https://science.nasa.gov/solar-system/planets/
- NASA solar facts and magnetism: https://science.nasa.gov/sun/facts/ and https://sdo.gsfc.nasa.gov/mission/science/irradiance.php
- NASA solar irradiance 1361 W/m² and ~0.1% 11-y activity: https://sunclimate.gsfc.nasa.gov/article/solar-irradiance and https://sunclimate.gsfc.nasa.gov/sun-and-climate
- NASA Earth orbital/Milankovitch forcing: https://science.nasa.gov/science-research/earth-science/climate-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/
- NASA Moon and solar tides: https://science.nasa.gov/moon/tides/
- NOAA galactic cosmic rays (EXTERNAL source / heliosphere filtering): https://www.spaceweather.gov/phenomena/galactic-cosmic-rays
- US EPA ozone and UVB DNA damage: https://www.epa.gov/ozone-layer-protection/basic-ozone-layer-science
- NOAA aquatic nitrate, phosphate, silica and trace nutrient requirements: https://www.aoml.noaa.gov/ocd/ocdweb/nutrients.html
- Diatom two-valve reproduction and size restoration: https://pmc.ncbi.nlm.nih.gov/articles/PMC8205531/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC7054031/

## Reproduce

From `nullrider_triatomic184/` (Node 22+, no packages):

```sh
node --test madre-prime/solar-system/solar.test.mjs
node --test engine.test.mjs mobius8x8/engine.test.mjs madre-prime/madre.test.mjs madre-prime/node-adaptive.test.mjs madre-prime/solar-system/solar.test.mjs
```

For GitHub Pages launch `madre-prime/solar-system/index.html` (relative ES module imports). Or open `standalone.html` directly; `make_standalone.py` packages imported source code into data-URI modules for local static viewing. `browser_test.py` uses Playwright Chromium to test the standalone version at desktop and mobile sizes and generate PNG previews. No network account required.

**Local outcome:** 13/13 new integration tests, 85/85 combined regression, 24/24 browser checks; no existing source modules edited.
