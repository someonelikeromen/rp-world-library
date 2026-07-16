# Tsukihime / Dead Apostle Profile Supplement Pilot — Stage 1 Status

Status: `stage-1-prep-generated`

Generated at: 2026-07-14

## Scope

This pilot is a prep/source-layer supplement for Type-Moon Tsukihime / Dead Apostle profile work. It does not create formal merged entities, final timelines, relationship graphs, or canonical records.

Allowed mutation scope used:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/tsukihime-dead-apostle-profile-supplement-pilot/**
```

## Inputs read

Prioritized raw worldbooks were read only:

- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json`
- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/奇妙的世界书DLC_型月篇2026_0126.worldbook.json`

Rule/plan files were read only for source-first, metadata, visual/ability/combat, and packet-gate requirements.

## Outputs created

- `source-unit-manifest.json`
- `sources/worldbook-profile/source-text-manifest.json`
- line-addressable source excerpt files under `sources/worldbook-profile/`
- packet plans under `work-packets/`
- `audit/prep/generator-report.json`
- `audit/prep/prep-audit-report.json`

## Boundaries

- No raw import file was edited.
- No old curated file was edited.
- No other Type-Moon pilot was edited.
- No Type-Moon core curated output was edited.
- No formal merged graph, timeline, entity, event, or relationship records were created.
- Forbidden aggregate basenames are intentionally not used.

## Continuity taxonomy policy

Central policy: `source-unit-manifest.json` → `sourcePolicy.continuityTaxonomyPolicy`.

Stage 1 prep taxonomy categories are:

- `original`
- `remake`
- `melty-blood`
- `kagetsu-tohya`
- `type-lumina`
- `sandbox`

Raw label mapping:

- `同人版` → `original`, with the raw source label preserved.
- `重制版` → `remake`, with the raw source label preserved.
- Mixed/crossover/RP premise material → `sandbox`.
- Explicit Melty Blood mentions → `melty-blood`.
- `歌月十夜` → `kagetsu-tohya`.
- Type Lumina names/mentions with no Stage 1 source text → `source-gap/candidate-only`, not source-backed facts.

If a category has no supporting Stage 1 source text, future extraction must mark it `source-gap/candidate-only` rather than invent facts.

## Known limitations

- This is a source/prep layer only; it records candidate scopes and extraction gates rather than formal facts.
- Some Tsukihime cast candidates are only visible as mentions in the currently read source excerpts. They remain candidate-only until future extraction reads direct profile entries or confirms absence.
- Raw source labels such as `同人版` and `重制版` are preserved where source excerpts include them and mapped only as prep taxonomy metadata.
