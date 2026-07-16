# Old Curated Preservation Report

Scope: FGO Part 1 Script Pilot final merge (`merge-final`).

## Decision

Old curated material was left untouched. The final merge created only derived pilot artifacts under the allowed `fgo-script-pilot` merge, timeline, graph, candidates, audit, comparison, and execution-log paths.

## Evidence Used

The merge used these pilot source-of-truth layers:

- `extracted/part1/*/world-state.json`
- `extracted/part1/*/events/*.json`
- `normalized/part1/*/characters/*.fragment.json`
- `normalized/part1/*/relationships/*.json`
- `audit/packet-audits/part1/*/final-status.json`

No source import files or old curated archives were written by this step.

## Migration Boundary

The pilot merge is a migration candidate layer, not an in-place curated archive update. Any later migration should be a separate reviewed step that maps canonical pilot entities to old curated entity IDs with explicit handling for source defects, variants, and identity reveals.
