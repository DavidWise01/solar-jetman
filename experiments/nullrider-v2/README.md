# NULLRIDER V2 — two-process signed handoff (experimental)

**Branch:** `experiment/nullrider-v2-handoff` of `DavidWise01/solar-jetman`. This experiment is an additive subdirectory; the repo's published `master` branch is untouched.

## Two endpoint identities

- Source reference: [`github.com/DavidWise01/solar-jetman`](https://github.com/DavidWise01/solar-jetman)
- Intended destination identity: [`https://0root.ai`](https://0root.ai)
- Local receiver for first tests: `127.0.0.1:8787`. **No code was installed on 0root.ai**. GitHub is not an automated network transmitter in this demo; the local sender reads and signs a fixture from the working copy of this repository.

## Use it like a builder

Requires Node 20+. No dependencies or cloud secrets.

```sh
cd experiments/nullrider-v2
npm run demo        # one command: generates dev keys, launches both processes, lands the Moon rider
npm run keys        # once; creates .local/{sender,receiver}/{private,public}.pem
npm test            # node:test positive/negative tests
npm run receiver    # terminal A: persistent local destination on 127.0.0.1:8787
npm run send        # terminal B: sealed Earth -> local Moon handoff
```

After a successful transfer, receipt files are at `.local/receiver/receipts/<tx_id>.json`. They are created with exclusive-create (`wx`) and synced to disk; repeated tx IDs are rejected, including after restarting the server. Create fresh transmissions for new attempts. `.local/` is excluded by this folder's `.gitignore`; **never upload the private keys**.

### What the prototype really does

1. Creates a manifest containing the exact V0 canonical glyph ``{{ space cowboy v4 :: jit :: `'0'` sjm/|\mjs }}``, the distinct signed ``-'smj`0`mjs +'``, `i{sjm}`, and ordered `sol:a → jet:b → man:c → man:d` shell records.
2. Hashes the **bytes** of the observation fixture; not the video. The toroidal-fields Reddit post is a **metadata-only test input**, not a scientific or authorship verification.
3. Signs the canonical envelope with a private Ed25519 sender key.
4. A *separate receiver process* authenticates the sender's signed bytes, verifies destination identity, SHA-256, rider, zipper order and exactly one `CROSS_0` declaration, and creates one write-once signed receipt.
5. The sender independently validates the Moon receiver's signature and checks digest, rider, destination, seam count, and transaction ID.

**Scope:** one signed logical crossing, **not** an actual physical air gap, encrypted payload, autonomous AI-to-AI communication, or an independent witness. Sender and receiver are distinct Node processes but are on the same development computer. Receipt persistence is per-file create-once; it is not an externally witnessed immutable audit chain. The metadata's `destination` string is an identifier, not evidence the production website received a message.

### Before deploying to 0root.ai

Determine whether its backend can securely run a server process and keep an Ed25519 private key secret. If it is static hosting, put the receiver on a separately managed backend under an authorized subdomain and configure HTTPS, access controls, rate limits, key rotation, and durable storage. Never embed signing private keys in public HTML or commit them to Git. The sender currently explicitly refuses non-local receiver URLs to prevent accidental remote posting.

**Original specification:** NULLRIDER-V0 remains untouched. This V2 is a forward experiment; it does not overwrite V0 or V1.

## Quick mental model

```text
GITHUB WORKING COPY (source identity)             0ROOT.AI (destination identity)
  local sender (sign + SHA-256)                local dev receiver (verify + sign)
        ZIP: d > c > b > a                               UNZIP: a > b > c > d
        smj -- [{i}] --> '0' -- /|\\ -- mjs
                                       -S+ SHARE

Signed receipt is returned only as a demo network reply; this is not the V0 one-way hardware gap.
```
