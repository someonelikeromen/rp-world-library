# Final Audit Summary - Merge LB3-LB4

Step id: `merge-lb3-lb4`
Model: `lt-yuyu/gpt-5.5`
Status: `passed`
Final read-only audit: `not-run-by-delegation`

## Gate Verification

- Source text manifest: `status=passed`, `expected=2`, `built=2`, `gateStatus=passed`.
- LB3 final-status: `status=passed`, `openIssues=0`, `blockedIssues=0`, `canAdvance=true`.
- LB4 final-status: `status=passed`, `openIssues=0`, `blockedIssues=0`, `canAdvance=true`.

## Merged Layer Counts

| Layer | Count |
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

## Decisions

- Built canonical merged layers under `merged/`, `timeline/`, `graph/`, `candidates/`, and `comparison/`.
- Preserved source-first terminology and raw source labels.
- Kept unsupported romanized/external labels as alias candidates only.
- Did not publish, modify source imports, overwrite old curated files, or run final read-only audit.
