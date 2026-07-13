# Fix Round R1 Report

Status: passed with non-blocking known issues.

Fixer-R1 remediated the R8 blocking output-shape and evidence issues inside the pilot directory only. No old curated files, source imports, docs, or skill files were modified. No shell or code execution tools were used.

## Fixes

- Created `merged/events/part1/<chapter>/*.json` canonical event wrappers for all 173 extracted event shards.
- Created `merged/relationships/edges/<chapter>/*.json` canonical edge wrappers for all 70 normalized relationship shards.
- Left existing relationship thread files as derived/thread summaries.
- Restored extraction support files per chapter: `extraction-report.json`, `stage-characters/index.json`, `dialogue/index.json`, `mentions/index.json`, and `candidates/index.json`.
- Added graph/timeline derived aliases and per-chapter timeline aliases.
- Added `comparison/migration-recommendation.md` alias.
- Restored missing Camelot, Babylonia, and Solomon auditor/fixer report evidence as R1 reconstructed evidence from present files.
- Updated final audit summary, known issues, pass report, merge manifest, and execution log.

## Validation

Read-only consistency checks were performed with `find`, `ls`, and representative `read` calls. The final R1 JSON report records the validation facts and residual risks.

## Known Issues

Orleans duplicate raw `事件N`, Okeanos Heracles continuity tension, and Solomon support-cast partial coverage remain non-blocking and explicitly documented.
