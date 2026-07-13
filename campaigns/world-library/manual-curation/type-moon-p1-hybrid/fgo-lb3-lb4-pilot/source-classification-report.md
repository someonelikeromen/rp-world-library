# FGO Lostbelt 3-4 Source Classification Report

Date: 2026-07-12
Step id: `prep-lb3-lb4`

## Decision

The Lostbelt 3-4 prep gate uses entries 95-96 of `[沙盒]FGO 0.8.worldbook.json` as script-primary source units.

Classification:

```text
classification: script-like
sourceType: user-file-worldbook-script
canonStatus: canon-like
credibility: B
formalEventSource: true
```

These entries are not official canon text and must not be labeled `canon-text` or `official-script`.

## Selected Primary Units

| entryIndex | comment | chapterId | classification | source use | direct sourceRef |
|---:|---|---|---|---|---|
| 95 | `FGO_LB3_人智统合真国` | `fgo-lb3-renzhi-tonghe-zhenguo` | script-like | script-primary | `[沙盒]FGO 0.8.worldbook.json:12320-12321` |
| 96 | `FGO_LB4_创世灭亡轮回` | `fgo-lb4-chuangshi-miewang-lunhui` | script-like | script-primary | `[沙盒]FGO 0.8.worldbook.json:12443-12444` |

Both entries were inspected and contain the required source sections:

```text
<world_state>
<stage_characters>
<world_timeline>
```

The same entries also appear in the raw mirror portions of the worldbook at `[沙盒]FGO 0.8.worldbook.json:12360-12361` and `[沙盒]FGO 0.8.worldbook.json:12483-12484`; the selected primary references are the main entry comment/content lines above.

## Prep Observations

| entryIndex | event code range | observed event markers | observed dialogue quotes | note |
|---:|---|---:|---:|---|
| 95 | `事件A0`, `事件A-事件T` | 21 | 34 | irregular raw code sequence must be preserved exactly |
| 96 | `事件A-事件U` | 21 | 25 | regular raw code sequence |

Counts are prep observations only. Downstream Generator/Auditor agents must recount from line-addressable source text and handle mismatches as audit issues.

## Secondary Sources

Secondary materials may be used only after explicit later scoping and only as cross-check or supplement. They may not overwrite source-primary event facts.

| source | classification | permitted use | formal event source |
|---|---|---|---|
| `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json` | story-summary | cross-check only | no |
| `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/奇妙的世界书DLC_型月篇2026_0126.worldbook.json` | character-profile | profile / variant supplement only | no |
| `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fgo/*.md` | curated-story-derived-from-worldbook-script | mirror / comparison only | no |

## Excluded from Formal Facts

The following are excluded from formal story facts unless later explicitly classified as engine/rule metadata outside canon facts:

- EJS controller entries
- MVU variable update entries
- sandbox or roleplay engine rules
- stage-character system判定 instructions
- agent inference
- summary-only claims
- model memory, game memory, or wiki impressions

## Mandatory Visual / Ability / Combat Rule

Every Lostbelt packet must extract appearance / ability / combat-effect details source-first:

- If the source explicitly says it, create a source-backed record.
- If the source does not explicitly say it, create `not-found-in-source` records.
- Never fill missing costume, equipment visual, Noble Phantasm, skill, magecraft, authority, transformation, summoning, or combat animation details from outside knowledge.
- Every formal downstream record must carry `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.

## Formal Store Rule

Do not create formal aggregate `characters.json`, `events.json`, or `relationships.json` fact stores. Downstream formal facts must be split into per-entity, per-event, or per-edge files with indexes only as indexes.

## Terminology Rule

No unsupported formal labels may be introduced. Preserve source-first raw Chinese terminology from the worldbook, and record normalized IDs or alternate labels only as candidates unless the current source supports them directly.
