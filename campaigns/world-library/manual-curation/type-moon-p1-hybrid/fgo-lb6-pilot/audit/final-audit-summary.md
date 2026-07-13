# Final Audit Summary — FGO LB6 Pilot Merge

Status: **passed** (merge-layer self-report; final read-only audit not run by instruction).

## Gate verification

- Source-text manifest: `status: passed`, `expected: 2`, `built: 2`, `gateStatus: passed`.
- LB6.1 packet final status: `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`.
- LB6.2 packet final status: `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`.

## Merge outputs

- Merged events: 45 total (LB6.1: 33; LB6.2: 12).
- Relationship edges: 21 total (LB6.1: 9; LB6.2: 12).
- Appearance records: 22 referenced through merged record sets.
- Ability records: 32 referenced through merged record sets.
- Combat-effect records: 36 referenced through merged record sets.

## Policy notes

- Source-first terminology retained with `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.
- LB6.1 duplicated raw `事件A0` preserved as two separate auditable merged event files with unique IDs and duplicate ordinals.
- Event raw fields `triggerRaw`, `completionRaw`, and `summaryRaw` retained in every merged event file.
- Relationship edges include `timelineId` and `timeRangeRaw`.
- Unsupported external/game/wiki labels are restricted to candidate layer.
- No final read-only audit was run in this step.
