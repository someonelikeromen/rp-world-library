# Type-Moon Nasuverse Extracted Publication Final Report

Date: 2026-07-20

## Verdict

Status: `passed-with-nonblocking-risks`

The formal pi/world_query-oriented extracted layer has been created under:

```text
campaigns/world-library/worlds/type-moon-nasuverse/extracted/
```

This layer is a source-linked extracted publication layer with representative shards and derived graph/timeline indexes. It does not replace the existing curated archive.

## Guardrails

- Raw imports were not modified.
- Old `curated/` was not modified.
- Candidate-only and source-gap records were not promoted into formal facts.
- Graph and timeline files are derived indexes, not primary fact stores.
- Forbidden aggregate basenames are not present in the extracted layer:
  - `characters.json`
  - `events.json`
  - `relationships.json`
  - `facts.json`
  - `graph.json`
  - `timeline.json`

## Formal Published Pilots

Published as formal source-linked indexes:

- `fsn-fz-pilot`
- `fgo-script-pilot`
- `fgo-eor-pilot`
- `fgo-lb1-lb2-pilot`
- `fgo-lb3-lb4-pilot`
- `fgo-lb5-pilot`
- `fgo-lb6-pilot`
- `fgo-ordeal-call-pilot`
- `kara-no-kyoukai-profile-supplement-pilot`
- `prisma-illya-profile-supplement-pilot`
- `lb6-fairy-calendar-supplement-pilot`
- `type-moon-core-general-settings-pilot`

## Held / Inventory-Only Pilots

These were not promoted into formal facts:

- `fate-spinoff-profile-supplement-pilot` — `source-gap-inventory-only`, blocked-insufficient-source.
- `tsukihime-supporting-cast-candidate-supplement-pilot` — candidate/source-gap only; no formal facts created.
- `tsukihime-dead-apostle-profile-supplement-pilot` — held from formal publication because pilot-local final status remains `merge-generated-pending-audit / not-published` pending separate read-only final audit.
- `mahoyo-profile-supplement-pilot` — held from formal publication because pilot-local status remains `fixer-retry-completed-pending-auditor-rerun / not-published`.

## Required Files

The extracted layer includes:

```text
README.md
manifest.json
audits/publication-inventory.md
audits/publication-inventory.json
audits/status-reconciliation-r10.md
audits/publication-final-status.json
audits/publication-final-report.md
sources/index.json
characters/index.json
events/index.json
relationships/index.json
rules/index.json
locations/index.json
abilities/index.json
organizations/index.json
items/index.json
timelines/derived-timeline-index.json
candidates/index.json
source-gaps/index.json
graph/derived-entity-graph.json
graph/derived-relationship-index.json
graph/derived-continuity-index.json
graph/graph-build-report.json
```

Representative shard files exist under `characters/shards/`, `events/shards/`, `relationships/shards/`, `candidates/shards/`, and `source-gaps/shards/`.

## Validation Evidence

Local validation after publication and reconciliation:

```text
JSON files checked across manual-curation + extracted: 2791
badCount: 0
forbidden basenames under extracted: none
```

## Nonblocking Risks

- The extracted layer uses source-linked indexes and representative shard records rather than copying every detailed accepted artifact.
- The source layer is p1-hybrid/manual-curation and local worldbook/import-backed; it is not primary canon and does not replace old curated.
- Mahoyo and Tsukihime Dead Apostle remain held/not-published until their required auditor gates pass.
- Fate spinoff remains blocked-insufficient-source / inventory-only.
- Candidate-only and source-gap boundaries must remain excluded from default formal retrieval.

## Status

```text
canUseAsPiExtractedLayer: true
canReplaceCurated: false
```
