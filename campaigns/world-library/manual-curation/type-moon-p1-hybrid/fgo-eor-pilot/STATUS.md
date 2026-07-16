# FGO Epic of Remnant P1 Pilot Status

Status: `merged-eor-final-accepted`

Last updated: 2026-07-12

## Scope

This pilot covers only FGO Epic of Remnant script-like source units from `[沙盒]FGO 0.8.worldbook.json` entries 89-92:

1. Shinjuku
2. Agartha
3. Shimousa
4. Salem

All outputs are isolated under:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-eor-pilot/
```

## Initial state

- Source entries 89-92 have been inspected in the primary source.
- Source classification and source-unit manifest have been prepared.
- Exactly four EoR work packet files have been prepared.
- Line-addressable source text has been created for all four entries under `sources/worldbook-script/eor/`.
- Chapter extraction has not started.
- Normalized fragments, merged canonical files, timelines, graphs, audits, and comparisons have not been created.
- Old curated archives, source imports, docs, skills, and the Part 1 pilot are not mutation targets.

## Source text layer

Built on 2026-07-12 using required model `lt-yuyu/gpt-5.5`.

- `sources/worldbook-script/eor/ch-089-shinjuku.txt`
- `sources/worldbook-script/eor/ch-090-agartha.txt`
- `sources/worldbook-script/eor/ch-091-shimousa.txt`
- `sources/worldbook-script/eor/ch-092-salem.txt`
- `sources/worldbook-script/eor/source-text-manifest.json` reports `expected: 4`, `built: 4`, `status: passed`.

The source text layer preserves frontmatter metadata, `<world_state>`, `<stage_characters>`, `<world_timeline>`, raw `-事件X` labels, trigger/completion markers, and dialogue lines from source entries 89-92.

## Required downstream gate

Each chapter must build/read line-addressable source text and then run:

```text
Generator -> Auditor -> Fixer -> Auditor rerun
```

until:

```text
status == passed
openIssues == 0
blockedIssues == 0
latestAudit.status == passed
canAdvance == true
```

## Mandatory extraction layers for every EoR packet

- Events: every raw `-事件X` event with raw event code, title, raw time, trigger, completion, orderIndex, and sourceRefs.
- Characters: stage characters, observed character mentions, roles, status changes, candidates, and sourceRefs.
- Relationships: source-backed relationship signals/candidates; no co-occurrence promotion.
- Appearance: source-backed appearance/outfit/equipment visual records when present; otherwise `not-found-in-source` records.
- Ability / Noble Phantasm / skill: source-backed activation/effect records when present; otherwise `not-found-in-source` records.
- Combat effects: source-backed combat visual/result/target/consequence records when present; otherwise `not-found-in-source` records.
- Dialogue: each quoted line linked as a dialogueRef or recorded with a skipped reason.

## Model and tool status

Required model: `lt-yuyu/gpt-5.5`.

No automatic model downgrade is allowed. No bash/shell/python/node/deno/powershell/cmd or executable scripts are allowed.

## Validation status

Readback validation completed for this prep stage:

- Required named artifacts: 7/7 present (`README.md`, `PLAN.locked.md`, `STATUS.md`, `source-inventory.json`, `source-classification-report.md`, `source-unit-manifest.json`, `execution-log.md`).
- EoR packet count: 4/4 under `work-packets/eor/`.
- Packet files present: `agartha.json`, `salem.json`, `shimousa.json`, `shinjuku.json`.
- Entries 89-92 were inspected and represented; no entry is blocked.
- Each packet declares `lt-yuyu/gpt-5.5`, source-first extraction, mandatory appearance / ability / combat-effect extraction, `not-found-in-source` requirements, and `Generator -> Auditor -> Fixer -> Auditor rerun` until passed.
- Source text created: yes, 4/4.
- Extraction started: yes, for Shinjuku, Agartha, Shimousa, and Salem.
- Shinjuku extraction final status: passed (`audit/packet-audits/eor/shinjuku/final-status.json` reports `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`).
- Shinjuku outputs created under `extracted/eor/shinjuku/`, `normalized/eor/shinjuku/`, and `audit/packet-audits/eor/shinjuku/`; no merge output was produced.
- Agartha extraction final status: passed (`audit/packet-audits/eor/agartha/final-status.json` reports `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`).
- Agartha outputs created under `extracted/eor/agartha/`, `normalized/eor/agartha/`, and `audit/packet-audits/eor/agartha/`; no merge output was produced.
- Shimousa extraction final status: passed (`audit/packet-audits/eor/shimousa/final-status.json` reports `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`).
- Shimousa outputs created under `extracted/eor/shimousa/`, `normalized/eor/shimousa/`, and `audit/packet-audits/eor/shimousa/`; mandatory appearance, ability, combat-effect, and not-found-in-source layers are present; no merge output was produced.
- Salem extraction final status: passed (`audit/packet-audits/eor/salem/final-status.json` reports `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`).
- Salem outputs created/repaired under `extracted/eor/salem/`, `normalized/eor/salem/`, and `audit/packet-audits/eor/salem/`; mandatory appearance, ability, combat-effect, and not-found-in-source layers are present; no merge output was produced and no formal aggregate `characters.json`, `events.json`, or `relationships.json` was created.
- Old curated, source imports, docs, skills, and Part 1 pilot modified: no intentional mutation; all writes were confined to the EoR pilot root mutation scope.
- Validation outcome: source text passed; Shinjuku, Agartha, Shimousa, and Salem chapter extraction packets passed their internal Generator -> Auditor -> Fixer -> Auditor rerun loops.

## Merge status

Merge completed on 2026-07-12 with required model `lt-yuyu/gpt-5.5`.

Created canonical source-first outputs under the allowed mutation scope:

- `merged/`: chapter index, world-state records, per-chapter events, relationship edges, character indexes, appearances, abilities, and combat effects.
- `timeline/eor/`: per-chapter timeline refs and master EoR timeline.
- `graph/`: derived node index, edge index, coverage index, and graph index.
- `candidates/eor/`: per-chapter character candidates and unsupported alias candidates.
- `comparison/eor-layer-comparison.json`: merged coverage comparison.
- `audit/final-known-issues.json`, `audit/final-pass-report.json`, `audit/final-audit-summary.md`, and `audit/final-acceptance.md`.

Final merged counts:

- Chapters: 4
- Events: 65
- Appearance records: 36
- Ability records: 50
- Combat-effect records: 53
- Relationship edges: 24
- Open issues: 0
- Blocked issues: 0
- Can advance: true

Final audit checks:

- All four chapter gates passed before merge.
- Unsupported external labels remain only as candidate records with `candidate-unsupported-by-current-source`.
- No formal aggregate `characters.json`, `events.json`, or `relationships.json` was created under `merged/`.

Final acceptance: `accepted`.


## Post-Parent-Fix Acceptance

Status after parent structural repair: `passed-with-nonblocking-risks`

A parent validation pass found two normalized aggregate event files after the initial EoR merge:

```text
normalized/eor/shinjuku/events.json
normalized/eor/shimousa/events.json
```

These were split into per-event files under:

```text
normalized/eor/shinjuku/events/
normalized/eor/shimousa/events/
```

The aggregate files were removed. The post-fix checks confirm:

- No `characters.json`, `events.json`, or `relationships.json` files remain anywhere under the EoR pilot.
- Shinjuku normalized events: 19 per-event files.
- Shimousa normalized events: 17 per-event files.
- Four EoR packet gates remain passed with `openIssues: 0`, `blockedIssues: 0`, and `canAdvance: true`.
- Full parent JSON parse check passed: 252 JSON files, 0 parse errors.
- Read-only post-parent-fix audit `r19` returned `passed-with-nonblocking-risks`.

Remaining nonblocking risks are limited to audit scope and future compatibility concerns, not current blockers.
