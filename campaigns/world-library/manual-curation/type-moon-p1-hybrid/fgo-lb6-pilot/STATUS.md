# STATUS — FGO LB6 Pilot

Current step: `merge-lb6`

Status: **merged canonical source-first layers passed / accepted-for-merge-pilot**

## Verified Gates

- Source-text gate: `passed` (`expected: 2`, `built: 2`, `gateStatus: passed`).
- LB6.1 packet final status: `passed`; `openIssues: 0`; `blockedIssues: 0`; `canAdvance: true`.
- LB6.2 packet final status: `passed`; `openIssues: 0`; `blockedIssues: 0`; `canAdvance: true`.

## Merge Outputs

- `merged/index.json`
- `merged/events/lostbelt/lb6-1-avalon-pre/` — 33 per-event files; duplicate raw `事件A0` preserved as two unique merged records.
- `merged/events/lostbelt/lb6-2-round-table-post/` — 12 per-event files.
- `merged/relationships/edges/lostbelt/lb6-1-avalon-pre/` — 9 per-edge files.
- `merged/relationships/edges/lostbelt/lb6-2-round-table-post/` — 12 per-edge files.
- `merged/appearances/lostbelt/*/records.json`
- `merged/abilities/lostbelt/*/records.json`
- `merged/combat-effects/lostbelt/*/records.json`
- `merged/character-stage-index.json`
- `merged/world-state-index.json`
- `timeline/lostbelt/index.json`
- `timeline/lostbelt/master.json`
- `graph/derived-index.json`
- `graph/relationship-edge-index.json`
- `candidates/alias-candidates.json`
- `comparison/lb6-packet-comparison.json`
- `audit/final-known-issues.json`
- `audit/final-pass-report.json`
- `audit/final-audit-summary.md`
- `audit/final-acceptance.md`
- `audit/final-status.json`

## Counts

- Merged events: 45 total (LB6.1: 33; LB6.2: 12).
- Relationship edges: 21 total (LB6.1: 9; LB6.2: 12).
- Appearance records: 22.
- Ability records: 32.
- Combat-effect records: 36.
- Stage-character groups: 13.
- Alias candidates: 16.

## Policy / Retention Status

- Source-first terminology retained.
- Every merged event includes `triggerRaw`, `completionRaw`, `summaryRaw`, `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.
- Every relationship edge includes `timelineId`, `timeRangeRaw`, `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.
- Unsupported external/game/wiki labels remain candidate-only in `candidates/alias-candidates.json`.
- No files named `characters.json`, `events.json`, or `relationships.json` were intentionally created.
- Final read-only audit: **not run** per delegation.

## Known Risks

- No executable JSON parser/shell validation was run because the task prohibited shell/code execution tools.
- Final read-only audit remains a separate future step if requested.


## Independent Final Audit Addendum

Final independent read-only audit: `passed-with-nonblocking-risks` (`r20`, `audit-lb6-final`).

Parent validation after audit:

- `JSON_FILES 190`
- `JSON_BAD 0`
- `PACKET_GATE PASSED`
- Forbidden aggregate files (`characters.json`, `events.json`, `relationships.json`): 0
- Merged per-event files excluding indexes: 45
- LB6.1 duplicate raw `事件A0` merged records: 2
- Missing merged event `triggerRaw` / `completionRaw`: 0
- Missing relationship `timelineId` / `timeRange`: 0

Post-audit documentation drift was repaired:

- `source-unit-manifest.json` status set to `accepted-with-nonblocking-risks`.
- `sourceTextBuilt` set to `2`.
- Both work packets now have `stageStatus: passed` and `sourceTextStatus: built`.

The Lostbelt 6 pilot is accepted for isolated side-by-side/manual-curation use with nonblocking risks retained in the audit report. It is not a replacement of the existing Type-Moon curated archive.
