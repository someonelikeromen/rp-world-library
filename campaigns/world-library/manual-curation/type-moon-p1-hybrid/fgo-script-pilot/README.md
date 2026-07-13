# FGO Part 1 Script Pilot

Status: preparation complete; downstream extraction not started.

This retry prepares the source inventory, source-unit manifest, and exactly nine Part 1 extraction packets for entries 80-88 of `[沙盒]FGO 0.8.worldbook.json`. It does not create source text, extracted shards, normalized fragments, canonical entities, timelines, graphs, or chapter outputs.

Required execution model: `lt-yuyu/gpt-5.5`.

Locked constraints:

- Source type is `user-file-worldbook-script`; canon status is `canon-like` or `adapted`, never `canon-text` or `official-script`.
- Every event, character fragment, and relationship edge must be stored in its own file and carry `sourceRefs`.
- Every packet runs `Generator -> Auditor -> Fixer -> Auditor rerun` until `passed`; no packet may advance while open or blocked issues remain.
- The raw event code is preserved. Orleans entry 81 has duplicate `事件N` and no `事件M`; occurrence-based IDs are required and raw codes must not be silently renumbered.
- Existing curated archives and source imports are read-only for this pilot.

Prepared artifacts:

- `source-inventory.json`
- `source-classification-report.md`
- `source-unit-manifest.json`
- `work-packets/part1/*.json` (exactly nine)
- `PLAN.locked.md`
- `execution-log.md`
