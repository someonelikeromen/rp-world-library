# Character Diff — FSN/FZ Pilot vs Old Curated

Date: 2026-07-12
Step id: `finalize-retry`

## Compared inputs

Old curated inputs inspected read-only:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/characters-index.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world.json`

Pilot inputs:

- `merged/merged-entities.json`
- `group-merged/waves-001-006-formal-merge.json`
- `group-merged/waves-013-018-derived-merge.json`

## Summary

Old curated is a broad Type-Moon character archive with 337 characters across FSN, FZ, Prisma Illya, FGO, and other continuities. The pilot is a scoped FSN/FZ p1-hybrid slice with 25 formal character/servant records and explicit continuity, identity, and candidate boundaries.

## Improvements in pilot

- FSN/FZ scope is explicit instead of mixed with Prisma/FGO/other lines.
- Same-name continuity risks are made explicit.
- `illyasviel-fsn-fz` is kept distinct from `prisma-illya-01`.
- `character-emiya-shirou-fsn` and `servant-archer-emiya-fsn` are related but not blindly merged.
- Core characters are supported by periodized outputs from wave-017.
- Candidate-only identities remain out of formal merged character records.

## Old curated risks observed

- Broad-world character index mixes continuities in one lookup surface.
- The first observed old curated character entry uses `prisma-illya-01` while carrying FSN-style source material and a parallel-world note, illustrating the continuity-overlap problem the pilot is intended to solve.
- Old entries are rich for roleplay detail but are not consistently periodized by route/time state.

## Pilot limitations

- Pilot character coverage is not exhaustive because source layer risks `SRC-001`, `SRC-002`, and `SRC-003` remain.
- Some FZ Servant class-only observations remain candidate-only where identity evidence was insufficient in the current source layer.
- Saber Artoria FZ/FSN periodization requires migration review before replacing any old curated entries.

## Decision

The pilot character layer is better structured for FSN/FZ timeline-aware querying, but it should be published side-by-side rather than replacing old curated character coverage.
