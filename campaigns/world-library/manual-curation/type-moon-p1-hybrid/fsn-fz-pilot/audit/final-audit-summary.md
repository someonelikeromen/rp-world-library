# Final Audit Summary — Type-Moon P1-Hybrid FSN/FZ Pilot

Date: 2026-07-12
Step id: `finalize-retry`
Model: `lt-yuyu/gpt-5.5`
Terminal status: `passed-with-known-risks`

## Scope

This retry completed final integration only for:

- `merged/`
- `audit/`
- `comparison/`
- `intermediate/`
- `candidates/`
- `execution-log.md`

No prep, source build, or wave extraction lanes were rerun. Existing wave, group merge, merged entity, graph, timeline, and candidate artifacts were treated as inputs.

## Inputs inspected

- Plan and skill authority:
  - `docs/type-moon-p1-hybrid-archive-plan.md`
  - `.pi/skills/type-moon-p1-hybrid-archive/SKILL.md`
- Pilot sources and manifests:
  - `source-manifest.json`
  - `wave-manifest.json`
- Wave status files:
  - `waves/wave-001/final-status.json` through `waves/wave-006/final-status.json`
  - `waves/wave-007/reports/final-status.json` through `waves/wave-018/reports/final-status.json`
- Group merge outputs:
  - `group-merged/waves-001-006-formal-merge.json`
  - `group-merged/waves-007-012-formal-merge.json`
  - `group-merged/waves-013-018-derived-merge.json`
- Final merged outputs:
  - `merged/merged-entities.json`
  - `merged/merged-graph.json`
  - `merged/merged-timeline.json`
- Candidate rollups:
  - `candidates/waves-013-018-candidate-rollup.json`
  - `candidates/waves-013-018-group-prep.json`
- Existing integration readback:
  - `intermediate/integration-readback.json`

## Wave status

All 18 waves are recorded as passed. No wave rerun was performed by this retry.

| Range | Status | Notes |
|---|---:|---|
| wave-001..wave-006 | passed | Older flattened layout, final status at wave root. |
| wave-007..wave-012 | passed | Planned reports layout, final status under `reports/`. |
| wave-013..wave-018 | passed | Planned reports layout, derived/candidate layers present. |

Aggregate wave status:

- Total waves: 18
- Passed: 18
- Open issues: 0
- Blocked issues: 0
- Retry reran waves: no

## Merged package status

Created final package index:

- `merged/index.json`

Merged package counts recorded from `merged/merged-entities.json`, `merged/merged-graph.json`, and `merged/merged-timeline.json`:

- Characters and servants: 25
- Factions: 7
- Locations: 11
- Abilities, systems, and concepts: 18
- Formal world rules: 10
- Events: 40
- Relationships: 20
- Graph nodes: 29
- Graph edges: 11
- Timelines: 4 route/FZ timeline files represented in compact merged timeline
- Cross-route alignments: 2

## Final integration repair

Readback found one real integration defect before final reporting:

- `merged/merged-graph.json` formal graph edges had `timelineId` but lacked required `timeRange`.

Repair completed in final integration scope:

- Added conservative `relative-only` `timeRange` objects to all 11 formal graph edges.
- Time ranges use existing FZ and route order bands from `merged/merged-timeline.json`.
- No source facts were invented; ranges are route-stage/orderIndex integration metadata.

After repair, all formal graph edges have:

- `sourceRefs`
- `confidence` medium or high
- `reviewStatus: audited`
- `timelineId`
- `timeRange`

## Known risks

No blocking issues remain, but the package carries non-blocking risks that prevent direct replacement of old curated:

- `SRC-001`: FSN core worldbook source text is a partial anchor extract, not full 53-entry coverage.
- `SRC-002`: FSN sandbox lorebook source text is partial and engine-heavy; only a small rule anchor set was normalized.
- `SRC-003`: Exact filtered count from `型月 (1).worldbook.json` remains unresolved.
- `ID-RECON-001`: Saber Artoria FZ/FSN periodization has a recorded reconciliation tension between earlier class-only candidate handling and later same-identity period/graph outputs.
- `MIGRATION-001`: Old curated is broad-world and mixed-continuity; this pilot is a scoped FSN/FZ slice.

Details are recorded in `audit/final-known-issues.json`.

## Validation status

- No bash, shell, Python, Node, Deno, PowerShell, or cmd was used.
- No subagents were spawned by this retry.
- Old curated was inspected for comparison only and was not modified.
- Source worldbook imports were not modified.
- Manual readback was completed with read/write/edit tools.
- Machine JSON validation was not run because the delegated tool constraint prohibited executable validation.

## Decision

The pilot final integration is accepted as `passed-with-known-risks`.

Recommended migration decision: `publish-curated-v2-pilot-side-by-side`.

Do not replace `campaigns/world-library/worlds/type-moon-nasuverse/curated/` from this pilot without explicit user approval and expanded source coverage.
