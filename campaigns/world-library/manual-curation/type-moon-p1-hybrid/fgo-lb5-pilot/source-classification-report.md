# FGO Lostbelt 5.1-5.2 Source Classification Report

Date: 2026-07-13
Step id: `prep-lb5`

## Decision

The Lostbelt 5.1-5.2 prep gate uses entries 97-98 of `[沙盒]FGO 0.8.worldbook.json` as script-primary source units.

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
| 97 | `FGO_LB5_1_亚特兰蒂斯` | `fgo-lb5-1-atlantis` | script-like | script-primary | `[沙盒]FGO 0.8.worldbook.json:12566-12567` |
| 98 | `FGO_LB5_2_奥林波斯` | `fgo-lb5-2-olympos` | script-like | script-primary | `[沙盒]FGO 0.8.worldbook.json:12689-12690` |

Both entries were inspected and contain the required source sections:

```text
<world_state>
<stage_characters>
<world_timeline>
```

The same entries also appear in raw mirror portions of the worldbook at `[沙盒]FGO 0.8.worldbook.json:12606-12607` and `[沙盒]FGO 0.8.worldbook.json:12729-12730`; the selected primary references are the main entry comment/content lines above.

## Prep Observations

| entryIndex | event code range | observed event markers | observed dialogue quotes | note |
|---:|---|---:|---:|---|
| 97 | `事件A1-事件A4`, `事件B-事件B3`, `事件C-事件C4`, `事件D-事件R` | 31 | 37 | irregular raw code sequence must be preserved exactly; raw time strings must not be corrected from memory |
| 98 | `事件A-事件A2`, `事件B1-事件B2`, `事件C1-事件C4`, `事件D1-事件D5` plus `事件D3.5`, `事件E1-事件E4`, `事件F1-事件F4`, `事件G-事件L` | 29 | 41 | decimal-like `事件D3.5` must be preserved exactly |

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

## Merge Retention Rule

Later merge must retain event `triggerRaw`, `completionRaw`, and `summaryRaw` from source-backed event records. Relationship edge records must retain `timelineId` and `timeRange`; do not publish static relationship edges without temporal scoping.

## Terminology Rule

No unsupported formal labels may be introduced. Preserve source-first raw Chinese terminology from the worldbook, and record normalized IDs or alternate labels only as candidates unless the current source supports them directly.
