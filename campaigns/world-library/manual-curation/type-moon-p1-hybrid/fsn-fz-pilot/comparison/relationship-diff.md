# Relationship Diff — FSN/FZ Pilot vs Old Curated

Date: 2026-07-12
Step id: `finalize-retry`

## Compared inputs

Old curated input inspected read-only:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/relationship-graph.json`

Pilot inputs:

- `merged/merged-graph.json`
- `group-merged/waves-013-018-derived-merge.json`
- `candidates/waves-013-018-candidate-rollup.json`

## Summary

Old curated relationship graph is broad-world and useful as a large lookup surface. The pilot relationship graph is smaller but stricter: 11 formal graph edges in `merged/merged-graph.json`, backed by 20 merged relationship records summarized in `merged/merged-entities.json`.

## Pilot improvements

- Formal edges require non-empty `sourceRefs`.
- Formal edges require `reviewStatus: audited`.
- Formal edges require confidence medium or high.
- Formal edges require `timelineId`.
- Finalize retry repaired formal graph edges so each now includes `timeRange`.
- Candidate and formal edges remain separated.
- Identity-sensitive edges such as Shirou/Archer same-entity and FZ/FSN Saber continuity are kept as candidates or recorded risks instead of silent merges.

## Old curated risks observed

- Relationship graph spans many Type-Moon continuities and therefore is not suitable as an isolated FSN/FZ route-time graph.
- Some old graph nodes represent non-character objects or concepts as character nodes, for example the inspected old relationship graph includes `魔性的跳高` and magical tool entries as `type: character`.
- Old relationship graph lacks the pilot's route-specific `timelineId` and `timeRange` requirements.

## Pilot limitations

- The pilot formal graph is intentionally compact and does not replace broad old curated relationship coverage.
- Some true-but-source-sensitive relationships remain candidate-only pending broader source transcription.

## Decision

The pilot relationship layer is structurally safer for FSN/FZ route-aware use. It should be used as a side-by-side v2 pilot graph, not as a direct replacement for broad old curated relationships.
