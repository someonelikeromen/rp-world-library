# FGO EoR Final Audit Summary

Status: `accepted`

Date: 2026-07-12
Model: `lt-yuyu/gpt-5.5`
Step id: `merge-eor`

## Gate Results

- Shinjuku, Agartha, Shimousa, and Salem final-status gates were read before merge.
- All four chapters reported `status: passed`, `openIssues: 0`, `blockedIssues: 0`, and `canAdvance: true`.
- No chapter gate failed, so the merge proceeded.

## Merged Coverage

| Layer | Count |
|---|---:|
| Chapters | 4 |
| Events | 65 |
| Appearance records | 36 |
| Ability records | 50 |
| Combat-effect records | 53 |
| Relationship edges | 24 |
| Not-found records tracked in packet comparison | 22 |

## Source-First Audit

- Canonical merged records carry `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.
- Relationship edges are derived only from source-backed relationship candidates; no co-occurrence promotion was applied.
- Unsupported external labels were not promoted. `德雷克` and `阿喀琉斯` remain only as `candidate-unsupported-by-current-source` Agartha alias candidates.
- No formal aggregate `characters.json`, `events.json`, or `relationships.json` exists under `merged/`.

## Output Roots

- `merged/`
- `timeline/`
- `graph/`
- `candidates/`
- `comparison/`
- `audit/`

Final audit result: accepted with `openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`.
