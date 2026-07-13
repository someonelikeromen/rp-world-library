# FGO Part 1 Script Pilot Final Acceptance

Decision: `accepted-with-nonblocking-risks`

Date: 2026-07-12

## Accepted Scope

This acceptance applies only to the FGO Part 1 script pilot under:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/
```

It does not authorize direct replacement of:

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/
```

## Acceptance Basis

The pilot is accepted because:

1. Part 1 source text coverage is complete for entries 80-88.
2. Nine chapter packets reached passed packet status.
3. Canonical event and relationship edge layers exist.
4. Timeline and graph files are derived indexes, not primary fact stores.
5. Appearance, ability / noble-phantasm, and combat-effect layers have been added to extracted, normalized, and merged layers.
6. Source-first terminology violations found in visual/ability/combat R1 were repaired in R2.
7. Parent full JSON parse validation passed after syntax repair: 955 JSON files, 0 parse errors.
8. No forbidden formal aggregate `characters.json`, `events.json`, or `relationships.json` files were found.
9. Old curated and source imports are not modified according to scoped status checks and pilot-local reports.

## Mandatory Visual / Ability / Combat Layer Status

Accepted as present:

```text
extracted/part1/<chapter>/appearance-signals/index.json
extracted/part1/<chapter>/ability-signals/index.json
extracted/part1/<chapter>/combat-effect-signals/index.json
normalized/part1/<chapter>/appearances/records.json
normalized/part1/<chapter>/abilities/records.json
normalized/part1/<chapter>/combat-effects/records.json
merged/appearances/part1/<chapter>/records.json
merged/abilities/part1/<chapter>/records.json
merged/combat-effects/part1/<chapter>/records.json
```

Rules accepted for future batches:

- If the source explicitly describes an appearance, ability, or combat effect, it must be represented as source-backed.
- If the source does not explicitly describe it, the archive must record `not-found-in-source`.
- Unsupported external labels may not be source-backed formal facts.
- Unsupported labels may appear only as `aliasCandidates` with `unsupported-by-current-source` or as legacy slugs requiring migration caution.

## Nonblocking Risks Carried Forward

- Legacy path/slug noise remains in some filenames.
- Many visual/costume/animation details are not present in the current source and are marked `not-found-in-source`.
- Orleans duplicate raw `事件N` / missing raw `事件M` persists as source defect.
- Okeanos Heracles continuity tension persists as source continuity note.
- Solomon support-cast coverage is not exhaustive.

## Next Recommended Batch

Proceed to FGO Epic of Remnant batch using the updated p1 plan and skill rules.

Candidate source entries:

```text
89 FGO_亚种特异点I_新宿
90 FGO_亚种特异点II_雅戈泰
91 FGO_亚种特异点III_下总国
92 FGO_亚种特异点IV_塞勒姆
```
