# MADRE PRIME — Red Rising / Iron Gold literary overlay

**Scope:** additive read-only fictional *Red Rising* lens over the existing one-Sun, eight-planet Madre Prime Solar System observatory.

## Two independent layers

1. **Real astronomy and biology:** `../solar.mjs` remains the underlying 74-entry scientific influence catalog. The UI continues to calculate *illustrative* irradiance, PAR, and symbolic 729-unit diatom division counts through `../bridge.mjs` and Node 184. These are not live telemetry or real biological mutation probabilities.
2. **Pierce Brown's fiction:** `overlay.mjs` adds a fourteen-Color Society caste catalog and book-4 *Iron Gold* era Solar System snapshot. Political groups in the story are not physical or astronomical categories. No fiction-world selection secretly changes scientific inputs.
3. **User's KET interpretation:** `Fe / iron / 26` as metaphorical material foundation → `Au / gold / 79` as metaphorical social apex, called `APEX PRIME` by the user. Gold is a ruling caste in the fiction; “Iron Gold” is a historical martial ideal associated with the Society's conquerors. “APEX PRIME” is **not an official literary rank**. Fe and Au are distinct chemical elements, not an Iron Gold chemical compound or an element-to-element conversion.

## Fiction snapshot (~753 PCE, book 4)

- Earth, Luna and Mars: Solar Republic; Venus: Society Remnant; Jupiter and Saturn regions/moons: Rim Dominion. Mercury is **contested/transitioning** during the narrative (Iron Rain campaign); it is deliberately not labeled as a static one-owner world.
- Uranus and Neptune remain mapped as *real* planets, but are not assigned an invented political control in this selected fiction snapshot.
- Named moons Luna, Phobos, Ganymede and Titan are supplemental lore points, **not four extra planets**.
- The novel depicts inequality, slavery, conquest, rebellion and the human costs of war; the interface maps those themes without endorsing the fictional caste ideology.
- Lore snapshot is simplified for visual comparison; events/alliances vary across books.

## Physical/canon/analogy integrity gates

- Fiction does not drive energy output, UV radiation, photosynthesis, DNA mutation, or 366/3 structural calculations.
- One real Sun, eight real planets; one activity cycle with eight *sampling bins*, not eight separate suns.
- Iron (Fe, atomic 26) and gold (Au, atomic 79) are real elements; “Iron Gold” is a fictional honorific and the title of book four, not an element.
- `RR_VIEW`, `RR_CATALOG`, `SOLAR_VIEW`, `SOLAR_CATALOG`, and read-only tower audits pass through numeric logical Node 184. Mutations such as `RENEW`, `FAULT`, `SWAP`, `RESEED` are denied *in this overlay* even if the underlying tower supports such operations; a JavaScript numeric gateway is not security authentication.
- The 365-cell operational core, 366th zero anchor, 8×8 Möbius swap, 2% renewal scheduling and original source files are unchanged.

## Sources

- Author's official series page: https://www.piercebrown.com/redrisingsaga
- Publisher *Red Rising*: https://www.penguinrandomhouse.com/books/221552/red-rising-by-pierce-brown/
- Publisher *Iron Gold*: https://www.penguinrandomhouse.com/books/545685/iron-gold-by-pierce-brown/
- Fandom wikis for secondary lore detail: https://red-rising.fandom.com/wiki/The_Society ; https://red-rising.fandom.com/wiki/The_Conquering ; https://red-rising.fandom.com/wiki/Gold
- Original Solar System science source catalog: `../README.md`.

## Run

On a static HTTP host, open `index.html`. The sibling `solar-system/` source and `madre-prime/` ancestor modules must be present. Alternatively, open the **dependency-bundled standalone.html** offline. Tests: `node --test overlay.test.mjs`, and `python browser_test.py` where Playwright + Chromium are installed.
