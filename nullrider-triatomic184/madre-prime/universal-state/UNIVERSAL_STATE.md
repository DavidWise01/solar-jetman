# MADRE PRIME PYRAMID — Universal State (10! / 4!)

Declared: 2026-10-16. Status: frozen symbolic address definition, additive to existing `10!` playground. This is a software/state-space model, not a physical claim of an 11D/12D universe, quantum dot, or biological genome architecture.

## Frozen expression

```text
{{ MADRE PRIME :: PYRAMID :: 10! / 4! :: UNIVERSAL STATE }}

10!           = 3,628,800      frozen parent permutations
4!            =        24      permutations folded per universal index
10!/4!        =   151,200      universal state addresses
             = P(10,6)        ordered six selections from ten labels
```

### Explicit mathematical semantics

Use ten distinguishable symbolic labels `0..9` only as **indexing labels**. Each universal address stores the **ordered first six labels** of a parent ten-label permutation. The other **four residual labels form an unordered remainder** for address comparison. This partitions all `10!` full permutations into 151,200 disjoint groups of exactly 24 parents. It is an address quotient, not a biological or cosmological count.

**Information preservation caveat:** The quotient by itself cannot recover the order of the remaining four labels; it is many-to-one. If a particular full parent permutation must later be restored byte-for-byte, retain its original residual order separately in an explicit event/history witness. Never claim lossless restoration from the quotient alone.

The four folded positions should **not** be silently identified with the previously established **four holograms/projections per layer**. Both use number four, but a mapping between them requires a separate rule from the user.

## Placement inside the existing Madre pyramid

```text
                         MADRE PRIME
                            /\
                           /10!\          parent 3,628,800  [FROZEN]
                          /----\
                         / 4!  \         internal 24-to-1 equivalence
                        /------\
                       / 151200 \        UNIVERSAL STATE index 0..151199
                      /----------\
                     /  366 / 3   \       TACH / GYRO / POSI 122 each
                    /--------------\
                   / Node 184 | .x. \     gate + existing reversible exchange
                  /__________________\
                           |
                       scalar 0         pinned reference
```

The seven-ring spire `66 / 36 / 6 / 6 / 3 / 1 / 1` and dual geometry tracks (odd toroids `1^1,3^3,5^5`; even cubi `2^2,4^4,6^6` in the project's original notation) are retained **unchanged**, not asserted to be factors of 151,200. The existing tower retains `366/3=122`, mapping to `365` operational cells and one pinned scalar-zero position. The separate layer model retains eight layers with four projections per layer (32 possible observer views). No previously built layer or pyramid structure is claimed to be complete beyond what exists in source.

## Code and operation

- `universal-state.mjs`: deterministic lexicographic `rankUniversal`, `unrankUniversal`, `foldFullPermutation`, and read-only `createUniversalState184().through184(...)` operations.
- `universal-state.test.mjs`: exhaustive round-trip of all 151,200 universal states plus 24-to-1 fold, gate, frozen constants and invalid-input checks.
- Operations: `SPEC`, `RANK`, `UNRANK`, `FOLD` through logical gate `via:184`; **no renewal/reseed/fault mutation** and no change to original 365-cell engine, 8×8 Möbius exchange or frozen `10!` record.
- `FOLD` consumes the full ten-label parent order but returns a *quotient index only*, intentionally discarding residual ordering unless held in another receipt.

Example:

```js
import { createUniversalState184 } from './universal-state.mjs';
const pyramid = createUniversalState184();
const snapshot = pyramid.through184({via:184, op:'UNRANK', index:0});
// selection [0,1,2,3,4,5], residual [6,7,8,9]
// parent permutation multiplicity 24
```

Verification: `node --test universal-state.test.mjs`.

## Freeze and revision

This record expresses the user's requested fixed symbolic universal-state quotient. It is an additive repository declaration, not a cryptographic write lock. Any later different mapping or expansion requires a separate version and should preserve this reference for comparison. No live core changes.
