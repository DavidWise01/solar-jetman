# SEEDED CROSS — Data release for 16,356-grid and reported attention (Oct 16, 2026)

## Data tiers — do not conflate

**SOURCE-REPORTED:** The file `index(20261016-014210).html` includes one last-position top token and rounded weight per each of 12 heads under normal softmax and Seeded Cross; it also includes claimed aggregate measurements. They have been faithfully extracted, but **raw pretrained weights, raw Q/K/V, and a working Seeded Cross operator were not attached**. Source SHA256 `dd8090f79f462431addc94abacdca571b421f85d9e1f3103c487d3ca0ca38bd9`.

**DERIVED:** `derived_grid_16356_cells.csv` contains 16,356 numerical cells from the existing GitHub volume engine. It uses an explicitly mathematical *display texture*, where `value = head_top_weight * (0.22 + 0.78*(0.68*exp(-2.6*r²)+0.32*(cos(5*angle + 1.6*r + 0.31*head)+1)/2))`. Each row is a deterministic visualization coordinate and not a distinct attention value measured by the transformer. Cross minus softmax derives from the two reported head weights. The new export uses exactly the JavaScript grid that powers the earlier page.

**MODEL CONFIG (PUBLIC):** `distilbert/distilgpt2`: 6 transformer layers, 12 attention heads, 768 embedding dimension, head dimension 64. See https://huggingface.co/distilbert/distilgpt2/blob/main/config.json .

**REAL PRETRAINED Q/K/V:** Not generated in this environment; pretrained weights are absent and direct model download was blocked. Use `COLAB_real_distilgpt2_QKV.ipynb` in Google Colab (runs a public model download in Colab) or `export_distilgpt2.py` on your own machine with internet, then use `compare_qkv.py` to compare native softmax heads with source-reported rounded weights. Neither exporter computes a custom Seeded Cross method.

## Selected source-reported comparisons

- Prompt: `The cat sat on the mat because it was tired`; reported layer: 0.
- Top token at last position agrees across 12/12 displayed heads. Source claims all positions, but the table itself covers **last position only**.
- Source-reported mean entropy: softmax 1.067, Seeded Cross 0.618 (ratio 0.57919).
- Source-reported block output drift 0.162.
- Last-position mean of head top weights: softmax 0.50667, cross 0.58667.
- Numerical tests: 6/6 preservation orientations × fields accepted; 6/6 injected faults rejected; 16,356 cells in each mode.

## Files

- `source_reported_12_heads.csv`: original per-head values in tidy columns.
- `source_reported_metrics.json`: original summary and 12-head values, with source file SHA.
- `derived_grid_16356_cells.csv`: all **derived** 3D points, 3 layers per point.
- `computed_comparison.json`: recalculated descriptive statistics, rotation/fault check.
- `export_distilgpt2.py`, `COLAB_real_distilgpt2_QKV.ipynb`: real Q/K/V data acquisition scripts (requires internet on runner).
- `compare_qkv.py`: compare native Q/K softmax to the original source summaries.
- `SYNTHETIC_TEST_ONLY_qkv.json`: separate deterministically generated causal attention sample, purely for importer testing, NOT pretrained.
- `SHA256SUMS.txt`: integrity manifest for the release.

This release is evidence-oriented; no model superiority or physical time-dilation finding is implied.
