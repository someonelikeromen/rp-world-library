# Part 1 Migration Recommendation

## Recommendation

Proceed to a reviewed migration planning phase, not direct overwrite of old curated data.

The Part 1 pilot is internally passable: all nine chapter packet statuses passed, the final merge preserved per-shard provenance, and no formal aggregate `characters.json`, `events.json`, or `relationships.json` file was created. The output is suitable as a source-backed candidate layer for curated migration.

## Required Migration Rules

1. Use `merged/part1-merge-manifest.json` as the chapter/count gate.
2. Use `timeline/part1-chronological-index.json` for order, but fetch event facts from `extracted/part1/*/events/*.json`.
3. Preserve Orleans duplicate raw `事件N`; do not synthesize `事件M`.
4. Preserve Okeanos Heracles continuity tension as a source note unless a later authoritative curated source resolves it.
5. Treat `merged/characters/entity-resolution-index.json` and `candidates/entity-resolution-candidates.json` as review inputs, not automatic ID rewrites.
6. Do not collapse Jeanne/Jeanne Alter, Saber Alter/Lion King, or London Solomon/Roman-Solomon/Goetia without explicit reviewed mapping.
7. Treat Solomon support-front representation as partial/key-fragment coverage; absent individual cameo fragment files are not evidence that a named cameo is absent from the source.

## Suggested Next Step

Create a migration map that pairs each accepted pilot canonical entity with the target old-curated entity ID, leaving unresolved candidates in a hold queue. Then run a diff-style review before any curated archive mutation.
