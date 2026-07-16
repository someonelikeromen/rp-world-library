# FGO Lostbelt 3-4 Pilot Execution Log

Date: 2026-07-13
Latest step id: `merge-lb3-lb4`
Model: `lt-yuyu/gpt-5.5`

## Current Step: `merge-lb3-lb4`

### Objective

Merged LB3-LB4 chapter outputs into canonical source-first layers under:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-lb3-lb4-pilot/
```

Built final reports only. Did not run final read-only audit, publish, modify source imports, overwrite old curated files, or touch other pilots.

### Gate Verification Read First

- `sources/worldbook-script/lostbelt/source-text-manifest.json`: `status=passed`, `expected=2`, `built=2`, `gateStatus=passed`.
- `audit/packet-audits/lostbelt/lb3-renzhi-tonghe-zhenguo/final-status.json`: `status=passed`, `openIssues=0`, `blockedIssues=0`, `canAdvance=true`.
- `audit/packet-audits/lostbelt/lb4-chuangshi-miewang-lunhui/final-status.json`: `status=passed`, `openIssues=0`, `blockedIssues=0`, `canAdvance=true`.

### References Read

- `normalized/lostbelt/lb3-renzhi-tonghe-zhenguo/index.json`
- `normalized/lostbelt/lb3-renzhi-tonghe-zhenguo/event-records.json`
- `normalized/lostbelt/lb3-renzhi-tonghe-zhenguo/layer-coverage.json`
- `normalized/lostbelt/lb4-chuangshi-miewang-lunhui/index.json`
- `normalized/lostbelt/lb4-chuangshi-miewang-lunhui/event-records.json`
- `normalized/lostbelt/lb4-chuangshi-miewang-lunhui/layer-coverage.json`
- LB3 and LB4 extracted `world-state.json`, `stage-characters/index.json`, `appearance-signals/appearance-index.json`, `ability-signals/ability-index.json`, `combat-effect-signals/combat-effect-index.json`, and `candidates/candidate-index.json`.

### Outputs Created

- `merged/index.json`
- `merged/events/lostbelt/lb3-renzhi-tonghe-zhenguo/`: 21 per-event files plus `index.json`
- `merged/events/lostbelt/lb4-chuangshi-miewang-lunhui/`: 21 per-event files plus `index.json`
- `merged/relationships/edges/lostbelt/lb3-renzhi-tonghe-zhenguo/`: 4 per-edge files
- `merged/relationships/edges/lostbelt/lb4-chuangshi-miewang-lunhui/`: 5 per-edge files
- `merged/relationships/index.json`
- `merged/appearances/lostbelt/lb3-renzhi-tonghe-zhenguo/records.json`
- `merged/appearances/lostbelt/lb4-chuangshi-miewang-lunhui/records.json`
- `merged/abilities/lostbelt/lb3-renzhi-tonghe-zhenguo/records.json`
- `merged/abilities/lostbelt/lb4-chuangshi-miewang-lunhui/records.json`
- `merged/combat-effects/lostbelt/lb3-renzhi-tonghe-zhenguo/records.json`
- `merged/combat-effects/lostbelt/lb4-chuangshi-miewang-lunhui/records.json`
- `merged/characters/index.json`
- `merged/world-state/index.json`
- `timeline/lostbelt/index.json`
- `timeline/lostbelt/master.json`
- `graph/index.json`
- `graph/nodes/index.json`
- `graph/edges/index.json`
- `candidates/index.json`
- `candidates/alias-candidate-index.json`
- `comparison/layer-comparison.json`
- `audit/final-known-issues.json`
- `audit/final-pass-report.json`
- `audit/final-audit-summary.md`
- `audit/final-acceptance.md`
- `STATUS.md`
- `execution-log.md`

### Merged Counts

| layer | count |
|---|---:|
| chapters | 2 |
| events | 42 |
| world state records | 2 |
| stage character records | 42 |
| engine-instruction-only records | 2 |
| appearance records | 19 |
| ability records | 38 |
| combat effect records | 38 |
| relationship edges | 9 |
| alias candidates unsupported by current source | 11 |
| not-found-in-source records | 11 |

### Source-First Decisions

- Formal records preserve raw Chinese/source labels and current packet terminology.
- Every formal record written in this step carries or inherits direct `sourceRefs`, `sourceType`, `credibility`, and `canonStatus` in the file record or chapter-level record group.
- `sourceType` is `user-file-worldbook-script`, credibility is `B`, and `canonStatus` is `canon-like`.
- Unsupported romanized/external labels remain candidate-only with `unsupported-by-current-source`.
- Relationship candidates were promoted only where packet data already marked them source-supported; they are represented as source-supported edge records with raw source labels.
- Stage-character system判定 instructions remain engine-instruction-only metadata, not canon facts.

### Constraint Log

- Wrote only under the authorized mutation scope: `merged/`, `timeline/`, `graph/`, `candidates/`, `comparison/`, `audit/`, `STATUS.md`, and `execution-log.md` inside the LB3-LB4 pilot.
- Did not modify source imports, old curated files, docs, skills, `fgo-script-pilot`, `fgo-eor-pilot`, `fgo-lb1-lb2-pilot`, or other pilots.
- Did not use bash/shell/python/node/deno/powershell/cmd or executable scripts.
- Did not spawn agents.
- Did not create files named `characters.json`, `events.json`, or `relationships.json` intentionally.
- Did not run final read-only audit.

## Previous Step: `chapter-lb4-chuangshi`

LB4 extraction, normalization, and packet audit passed. Final status reported `passed`, `openIssues=0`, `blockedIssues=0`, `latestAuditStatus=passed`, `canAdvance=true`. Coverage: 21 raw events, 25 dialogue records, 22 stage characters plus 1 engine-instruction-only record, 9 appearance signals, 16 ability signals, 17 combat effect signals, 5 not-found records, 7 alias candidates, and 5 relationship candidates.

## Previous Step: `chapter-lb3-renzhi`

LB3 extraction, normalization, and packet audit passed. Final status reported `passed`, `openIssues=0`, `blockedIssues=0`, `latestAuditStatus=passed`, `canAdvance=true`. Coverage: 21 raw events, 34 dialogue records, 20 stage characters plus 1 engine-instruction-only record, 10 appearance signals, 22 ability signals, 21 combat effect signals, 6 not-found records, 4 alias candidates, and 4 relationship candidates.

## Previous Step: `source-text-lb3-lb4`

Built line-addressable source text for entries 95 and 96. Manifest reports `status=passed`, `expected=2`, `built=2`, and `gateStatus=passed`.

## Previous Step: `prep-lb3-lb4`

Prep gate completed on 2026-07-12 with two expected work packets and extraction not started.

## Next Gate

Independent final read-only audit remains a later optional gate. Publication, source import changes, old curated overwrite, and other pilot changes remain closed.


## Parent merge-layer blocking fix 2026-07-12T17:03:00.083Z

Backfilled triggerRaw/completionRaw/summaryRaw from extracted events into merged event files. Added timelineId and timeRange to merged relationship edges, derived from linked source-backed eventRefs.
