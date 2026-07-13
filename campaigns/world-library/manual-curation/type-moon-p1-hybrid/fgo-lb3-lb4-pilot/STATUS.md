# FGO Lostbelt 3-4 Pilot Status

Date: 2026-07-13
Latest step id: `merge-lb3-lb4`
Model: `lt-yuyu/gpt-5.5`
Status: **accepted - source-first merged layers built / final read-only audit not run**

## Gate Status

- Prep gate: `ready` (parent-validated; two packets exist; prep JSON reported clean).
- Source text gate: `passed`; `expected=2`, `built=2`, `gateStatus=passed`.
- Extraction gate: `lb3-passed`; `lb4-passed`.
- Normalization gate: `lb3-packet-normalized-passed`; `lb4-packet-normalized-passed`.
- Merge gate: `accepted`.
- Timeline / graph gate: `derived-indexes-built`.
- Final read-only audit: `not-run-by-delegation`.
- Publication gate: `closed`; no old curated overwrite is authorized.

## Required Gate Verification

| gate | status | expected | built | gateStatus | openIssues | blockedIssues | canAdvance |
|---|---|---:|---:|---|---:|---:|---|
| source text manifest | passed | 2 | 2 | passed | n/a | n/a | n/a |
| `fgo-lb3-renzhi-tonghe-zhenguo` final-status | passed | n/a | n/a | n/a | 0 | 0 | true |
| `fgo-lb4-chuangshi-miewang-lunhui` final-status | passed | n/a | n/a | n/a | 0 | 0 | true |

## Merged Output Roots

- `merged/index.json`
- `merged/events/lostbelt/lb3-renzhi-tonghe-zhenguo/`
- `merged/events/lostbelt/lb4-chuangshi-miewang-lunhui/`
- `merged/relationships/edges/lostbelt/lb3-renzhi-tonghe-zhenguo/`
- `merged/relationships/edges/lostbelt/lb4-chuangshi-miewang-lunhui/`
- `merged/appearances/lostbelt/*/records.json`
- `merged/abilities/lostbelt/*/records.json`
- `merged/combat-effects/lostbelt/*/records.json`
- `merged/characters/index.json`
- `merged/world-state/index.json`
- `timeline/lostbelt/index.json`
- `timeline/lostbelt/master.json`
- `graph/index.json`, `graph/nodes/index.json`, `graph/edges/index.json`
- `candidates/index.json`, `candidates/alias-candidate-index.json`
- `comparison/layer-comparison.json`
- `audit/final-known-issues.json`
- `audit/final-pass-report.json`
- `audit/final-audit-summary.md`
- `audit/final-acceptance.md`

## Merged Counts

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

## Source-First Policy

- Formal records use `sourceType: user-file-worldbook-script`, `credibility: B`, and `canonStatus: canon-like`.
- Raw source terminology is preserved for formal labels.
- Unsupported external/game/wiki/romanized labels remain alias candidates with `unsupported-by-current-source` and are not promoted to formal labels.
- Engine-instruction-only stage records remain non-canon-fact metadata.
- Forbidden aggregate filenames `characters.json`, `events.json`, and `relationships.json` were not intentionally created.

## Validation Performed In This Step

- Read source text manifest and confirmed `status: passed`, `expected: 2`, `built: 2`, `gateStatus: passed`.
- Read LB3 and LB4 packet final-status files and confirmed `status: passed`, `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`.
- Built canonical merged layers and final reports only under the authorized mutation scope.
- Did not use bash/shell/python/node/deno/powershell/cmd or executable scripts.
- Did not run final read-only audit.

## Remaining Gate

Independent final read-only audit remains available for a later delegated step. Publication, source import changes, old curated overwrite, and other pilot changes remain closed.


## Independent Final Audit Addendum

Final independent read-only audit after parent merge-layer fix: `passed-with-nonblocking-risks` (`r10`, `audit-lb3-lb4-postfix`).

Parent validation after post-fix audit:

- `JSON_FILES 164`
- `JSON_BAD 0`
- Both packet gates passed (`openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`).
- Forbidden aggregate files (`characters.json`, `events.json`, `relationships.json`): 0.
- Merged per-event files excluding chapter indexes: 42.
- Missing merged event `triggerRaw` / `completionRaw`: 0.
- Missing relationship `timelineId` / `timeRange`: 0.

The prior blocking merge-layer omissions are closed. The Lostbelt 3-4 pilot is accepted for isolated side-by-side/manual-curation use with nonblocking risks retained in the audit report. It is not a replacement of the existing Type-Moon curated archive.
