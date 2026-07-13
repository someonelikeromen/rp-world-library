# FGO EoR Source Classification Report

Date: 2026-07-12

## Decision

The Epic of Remnant batch uses entries 89-92 of `[沙盒]FGO 0.8.worldbook.json` as script-primary source units.

Classification:

```text
classification: script-like
sourceType: user-file-worldbook-script
canonStatus: canon-like
credibility: B
formalEventSource: true
```

These entries are not official canon text and must not be labeled `canon-text` or `official-script`.

## Selected primary units

| entryIndex | comment | chapterId | classification | source use |
|---:|---|---|---|---|
| 89 | `FGO_亚种特异点I_新宿` | `fgo-eor-shinjuku` | script-like | script-primary |
| 90 | `FGO_亚种特异点II_雅戈泰` | `fgo-eor-agartha` | script-like | script-primary |
| 91 | `FGO_亚种特异点III_下总国` | `fgo-eor-shimousa` | script-like | script-primary |
| 92 | `FGO_亚种特异点IV_塞勒姆` | `fgo-eor-salem` | script-like | script-primary |

All four entries were inspected and contain the required source sections:

```text
<world_state>
<stage_characters>
<world_timeline>
```

## Secondary sources

Secondary materials may be used only after explicit later scoping, and only as cross-check or supplement. They may not overwrite source-primary event facts.

| source | classification | permitted use | formal event source |
|---|---|---|---|
| `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json` | story-summary | cross-check only | no |
| `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/奇妙的世界书DLC_型月篇2026_0126.worldbook.json` | character-profile | profile/variant supplement only | no |
| `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fgo/*.md` | curated-story-derived-from-worldbook-script | mirror/comparison only | no |

## Excluded from formal facts

The following are excluded from formal story facts unless later explicitly classified as engine/rule metadata outside canon facts:

- EJS controller entries
- MVU variable update entries
- sandbox or roleplay engine rules
- agent inference
- summary-only claims
- model memory, game memory, or wiki impressions

## Mandatory visual/ability/combat rule

Every EoR packet must extract appearance / ability / combat-effect details source-first:

- If the source explicitly says it, create a source-backed record.
- If the source does not explicitly say it, create `not-found-in-source` records.
- Never fill missing costume, equipment visual, Noble Phantasm, skill, or combat animation details from outside knowledge.

## Source-count note

Event and quote counts are estimates inherited from the p1 plan. Downstream Generator/Auditor agents must recount directly from line-addressable source text, preserve every raw event, and handle any source/count mismatch as an audit item rather than inventing or deleting facts.
