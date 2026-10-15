# NULLRIDER V2 — Local integration test record

**Date:** 2026-10-15. **Branch:** `experiment/nullrider-v2-handoff`. **Environment:** Node.js 22.16.0 on the local development container.

**Result:** `npm test`: 16/16 pass, zero failures. `npm run demo`: one accepted local Moon transaction, Ed25519 signature verified, one create-once receipt written. Both receiver and sender ran as separate Node processes on `127.0.0.1`.

**Covered:** SHA-256 known vector; exact canonical and signed glyph preservation; zipper/inverse order; signed payload receipt; durable receipt file; same-tx replay 409; byte tamper; re-signed digest tamper; rider substitution; shell reorder; extra crossing; destination substitution; glyph conflation; unknown signer; forged receipt; HTML-shaped name handled as inert JSON; size bounds; forged receipt field; replay prevention after server restart.

**Evidence fixture:** `toroidal-fixture.json`—a snapshot of Reddit post metadata, not the source video bytes, its provenance, or the scientific truth of toroidal-field claims.

**Limitations:** Source/destination **identities** are GitHub `DavidWise01/solar-jetman` and `https://0root.ai`. No endpoint was deployed to the website, and no remote transit was performed. HTTPS, physically separate machines, operational key provisioning/rotation, disaster recovery, bounded replay-journal storage, tamper-evident receipts outside the recipient, and independent third-party review remain untested. The signed receipt attests only to the local receiver's verification and not to copyright or a causal lineage. It is not hardware air-gap enforcement.

**Build decision:** Prototype eligible for user testing on an isolated experiment branch. Do not publish under 0root.ai or merge into production without a hosting and credential-management plan.
