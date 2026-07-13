# World Rule Diff — FSN/FZ Pilot vs Old Curated

Date: 2026-07-12
Step id: `finalize-retry`

## Compared inputs

Old curated inputs inspected read-only:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world-rules/index.json` was attempted but that index file was not present.

Pilot inputs:

- `merged/merged-entities.json`
- `group-merged/waves-013-018-derived-merge.json`
- `waves/wave-013/output/world-rule-stratification.json` as summarized by group merge

## Summary

Old curated `world.json` gives broad Type-Moon world rules across magecraft, true magic, Noble Phantasms, Servant classes, Dead Apostles, Beasts, fairy systems, and other lines. This is useful for global context, but too broad for FSN/FZ pilot formal facts.

The pilot has 10 formal world rules and explicit strata:

- Formal allowed classes: `canon-like-world-rule`, `sandbox-rule`
- Support-only classes: `rp-engine-rule`, `discarded-engine-mechanic`, `style-constraint`

## Pilot improvements

- FSN/FZ-relevant world rules are scoped to Holy Grail War, Servant summoning, Command Spells, Grail contamination, Third Magic, and sandbox boundary rules.
- Engine and style constraints are not promoted into canon-like formal rules.
- Rule classes are explicit so retrieval can avoid using RP engine mechanics as world facts.

## Old curated risks observed

- Old global world rules mix broad Type-Moon systems with FGO/Fairy Britain material in one world-level surface.
- Old rule surfaces are useful for background, but not strict enough for route-specific FSN/FZ timeline answers.

## Pilot limitations

- The sandbox rule source was only partially normalized. Some old curated rules may still be useful as comparison material until source transcription is expanded.

## Decision

Pilot world-rule stratification is structurally safer for FSN/FZ retrieval, but old curated world rules should remain available for broad-world context. Do not replace old rules from this pilot alone.
