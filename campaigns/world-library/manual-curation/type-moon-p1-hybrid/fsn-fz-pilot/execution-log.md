# Execution Log — FSN/FZ Pilot finalize-retry

Date: 2026-07-12
Step id: `finalize-retry`
Model: `lt-yuyu/gpt-5.5`
Terminal status: `passed-with-known-risks`

## Objective

Retry only the final integration step after the previous `finalize` run failed due to transient service unavailability after writing merged entity, graph, and timeline artifacts.

This retry did not rerun prep-source, source-build, wave lanes, group merge lanes, graph builder lanes, or timeline builder lanes.

## Authority read

Read and followed:

- `docs/type-moon-p1-hybrid-archive-plan.md`
- `.pi/skills/type-moon-p1-hybrid-archive/SKILL.md`

Hard constraints observed:

- No modification to `campaigns/world-library/worlds/type-moon-nasuverse/curated/`.
- No modification to source worldbook imports.
- Final integration only.
- Candidate and formal layers kept separate.
- No bash/shell/Python/Node/Deno/PowerShell/cmd used.
- No subagents spawned.

## Existing pilot artifacts inspected

Manifests and source status:

- `source-manifest.json`
- `wave-manifest.json`

Wave final status:

- `waves/wave-001/final-status.json`
- `waves/wave-002/final-status.json`
- `waves/wave-003/final-status.json`
- `waves/wave-004/final-status.json`
- `waves/wave-005/final-status.json`
- `waves/wave-006/final-status.json`
- `waves/wave-007/reports/final-status.json`
- `waves/wave-008/reports/final-status.json`
- `waves/wave-009/reports/final-status.json`
- `waves/wave-010/reports/final-status.json`
- `waves/wave-011/reports/final-status.json`
- `waves/wave-012/reports/final-status.json`
- `waves/wave-013/reports/final-status.json`
- `waves/wave-014/reports/final-status.json`
- `waves/wave-015/reports/final-status.json`
- `waves/wave-016/reports/final-status.json`
- `waves/wave-017/reports/final-status.json`
- `waves/wave-018/reports/final-status.json`

Group and merged artifacts:

- `group-merged/waves-001-006-formal-merge.json`
- `group-merged/waves-007-012-formal-merge.json`
- `group-merged/waves-013-018-derived-merge.json`
- `merged/merged-entities.json`
- `merged/merged-graph.json`
- `merged/merged-timeline.json`
- `candidates/waves-013-018-candidate-rollup.json`
- `candidates/waves-013-018-group-prep.json`
- `intermediate/integration-readback.json`

Old curated inputs inspected read-only for comparison:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/characters-index.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/relationship-graph.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/plot-graph.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/index.json`

Attempted read for old curated world-rule index:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world-rules/index.json` was not present.

## Status findings

All 18 wave final-status files are present and passed:

- wave-001..wave-006 use older flattened layout with `final-status.json` at wave root.
- wave-007..wave-018 use planned `reports/final-status.json` layout.
- Aggregate wave status: 18 passed, 0 open issues, 0 blocked issues.

Merged package already contained:

- `merged/merged-entities.json`
- `merged/merged-graph.json`
- `merged/merged-timeline.json`

Missing final integration artifacts before retry:

- `merged/index.json`
- `audit/final-audit-summary.md`
- `audit/final-known-issues.json`
- `audit/final-pass-report.json`
- `comparison/*`
- retry-specific integration readback

## Final integration repair

A real integration defect was found in `merged/merged-graph.json`:

- Formal graph edges had `timelineId` but lacked required `timeRange`.

Repair performed:

- Added conservative `relative-only` `timeRange` objects to all 11 formal graph edges.
- Used existing route/FZ order bands from `merged/merged-timeline.json`.
- Did not invent calendar dates or source facts.

Post-repair readback confirmed every formal graph edge has:

- `sourceRefs`
- `confidence` medium/high
- `reviewStatus: audited`
- `timelineId`
- `timeRange`

## Artifacts written or updated

Updated:

- `merged/merged-graph.json`
- `execution-log.md`

Created:

- `merged/index.json`
- `audit/final-audit-summary.md`
- `audit/final-known-issues.json`
- `audit/final-pass-report.json`
- `comparison/character-diff.md`
- `comparison/relationship-diff.md`
- `comparison/plot-graph-noise-report.md`
- `comparison/world-rule-diff.md`
- `comparison/source-coverage-diff.md`
- `comparison/timeline-improvement-report.md`
- `comparison/migration-recommendation.md`
- `intermediate/finalize-retry-readback.json`

## Package counts

From merged outputs:

- Characters and servants: 25
- Factions: 7
- Locations: 11
- Abilities, systems, and concepts: 18
- Formal world rules: 10
- Events: 40
- Relationships: 20
- Graph nodes: 29
- Graph edges: 11
- Timeline route/FZ surfaces: 4
- Cross-route alignments: 2

## Known issues carried forward

Recorded in `audit/final-known-issues.json`:

- `SRC-001`: FSN core worldbook source text is partial anchor extract, not full 53-entry coverage.
- `SRC-002`: FSN sandbox lorebook source text is partial and engine-heavy.
- `SRC-003`: Exact filtered count from `型月 (1).worldbook.json` is unresolved.
- `ID-RECON-001`: Saber Artoria FZ/FSN periodization requires migration review.
- `MIGRATION-001`: Old curated is broad-world and mixed-continuity; this pilot is a scoped FSN/FZ slice.

Resolved during retry:

- `GRAPH-TIMERANGE-001`: formal graph edges missing `timeRange`; repaired in `merged/merged-graph.json`.

## Migration decision

Recommendation written to `comparison/migration-recommendation.md`:

`publish-curated-v2-pilot-side-by-side`

Do not replace old curated from this pilot. The pilot is accepted for side-by-side review as `passed-with-known-risks`.

## Validation status

- Manual readback completed with read/write/edit-style tooling.
- Machine JSON validation was not run because no executable tools were allowed in the delegated task.
- Old curated was read for comparison only and not modified.
- Source worldbook imports were not modified.
- No source text, wave output, group merge, or old curated files were rerun or overwritten.
