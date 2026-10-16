# Seeded Cross — Q/K/V attention bridge (V3 experiment)

The live page is in `DavidWise01/solar-jetman/seeded-cross-qkv/`. It is **additive**: prior Seeded Cross and Solar Jetman builds are not replaced.

## What is measured and what isn't

- **Exporter:** `export_distilgpt2.py` loads **actual pretrained** `distilbert/distilgpt2` weights on *your own machine*, runs a forward pass, extracts layer-0 Q/K/V matrices (12 heads × N tokens × 64 dimensions), and verifies the causal softmax reconstructed from Q/K agrees numerically with the model's forward attention. Writes a UTF-8 JSON export and SHA-256 sidecar.
- **Viewer:** imports the exported data and mathematically validates every attention row for finiteness, normalization, causal masking and agreement with Q/K. Inspectable fields: causal softmax, Q×K alignment, and value-vector norm.
- **Grid:** exactly `12 × 29 × 47 = 16,356` visualization points, **resampled from native 12 × N × N attention** using deterministic nearest-neighbor mappings. They are not 16,356 independent measurements. When N is larger than the display resolution some positions are subsampled.
- **Preservation:** Solar A ⇄ Solar B reverses the 29×47 display addresses by 180°. Checks all 16,356 derived Float64 cells for exact equality and rejects a one-cell mutation. It does **not** prove physical conservation or cryptographically sign the receiver's receipt.
- **Seeded Cross vs softmax:** The supplied source only contains reported *Seeded Cross* summaries, not a reproducible cross-attention formula. This build **does not** claim to compute or benchmark Seeded Cross attention from Q/K/V. The importer exclusively works with standard causal softmax and the explicitly described additional field projections.
- **Provenance:** A SHA-256 of uploaded JSON authenticates the downloaded bytes only against another known hash. It does not attest that a file came from Hugging Face or was produced by this exporter; signed model/version attestations are future work.

## Real-model export on a computer with internet

```bash
python -m pip install 'torch' 'transformers>=4.45,<5'
python export_distilgpt2.py --output distilgpt2-layer0-qkv.json
```

Open the page and use **Import your actual Q/K/V JSON**. This run requires a real model download (about hundreds of MB) if not already cached. The displayed token count depends on the real tokenizer output, not the number of words.

Customize the prompt:

```bash
python export_distilgpt2.py --prompt "A mirror carries the same message to the zero seam" --output mirror.json
```

The script refuses to export if the reconstructed attention diverges from the model output. It does not download or execute a Seeded Cross implementation.

## Offline demo / tests

```bash
python make_fixture.py
node --test data.test.mjs
python browser_test.py
```

The browser **generates a small, explicitly synthetic** 5-token causal attention fixture without a network request. `synthetic_qkv_fixture.json` is a separate 8-token fixture for the numerical test suite. Neither substitutes for pretrained model evidence. No trained-model weights were available in the testing container, and outbound model-host access was blocked. Browser tests used a dynamically assembled **in-memory equivalent of the JS modules** because sandbox navigation to localhost and routed domains was blocked. GPU Three.js rendering and real-model execution need a machine with those capabilities.

Run via any static-file server (e.g. `python -m http.server 8765`) or GitHub Pages. Do not open `index.html` via `file://` if your browser blocks ES-module imports.

## Boundaries

Unsigned local receipts; no cross-process/hosted exchange; no use of private auth credentials; no claim of tested model superiority, physical time dilation, or independent proof of original authorship.