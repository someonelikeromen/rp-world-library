# FGO Ordeal Call I-III Source Classification Report

Date: 2026-07-13
Step id: `prep-ordeal-call`

## Decision

The Ordeal Call I-III prep gate uses entries 104, 105, and 106 of `[沙盒]FGO 0.8.worldbook.json` as script-primary source units.

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

| entryIndex | comment | chapterId | titleRaw | source use | direct sourceRef |
|---:|---|---|---|---|---|
| 104 | `FGO_奏章I_纸月` | `fgo-ordeal-call-1-paper-moon` | `FGO_奏章I_虚数罗针内界_纸月` | script-primary | `[沙盒]FGO 0.8.worldbook.json:13427-13428` |
| 105 | `FGO_奏章II_伊德` | `fgo-ordeal-call-2-id` | `FGO_奏章II_不可逆废弃孔_伊德` | script-primary | `[沙盒]FGO 0.8.worldbook.json:13550-13551` |
| 106 | `FGO_奏章III_统合` | `fgo-ordeal-call-3-integration` | `FGO_奏章III_新灵长后继战_Archetype_Inception` | script-primary | `[沙盒]FGO 0.8.worldbook.json:13673-13674` |

Each selected entry contains `核心设定`, `故事梗概`, `阶段划分与日期推测`, and `重要角色阵容` sections. These section names must be preserved as source-first terms during later extraction.

The same entries also appear in raw mirror portions of the worldbook at `[沙盒]FGO 0.8.worldbook.json:13467-13468`, `[沙盒]FGO 0.8.worldbook.json:13590-13591`, and `[沙盒]FGO 0.8.worldbook.json:13713-13714`. The selected primary references are the main entry comment/content lines above.

## Prep Observations

| entryIndex | packet slug | observed phase units | source-specific notes |
|---:|---|---:|---|
| 104 | `oc1-paper-moon` | 4 | Paper Moon / Alter Ego clearing chapter; source references `虚数罗针内界`, `纸月`, `拉尼VIII`, `Alter Ego`, `Avenger`, `迦梨`, and `职阶清算领域`. |
| 105 | `oc2-id` | 4 | Id / Avenger clearing chapter; source references `不可逆废弃孔`, `伊德`, `精神世界`, `复仇者`, `卡里奥斯特罗`, and `所有Avenger职阶的灵基图谱完全变暗`. |
| 106 | `oc3-integration` | 4 | Integration / MoonCancer clearing chapter; source references `新灵长后继战`, `Archetype Inception`, `迪拜`, `Mooncell`, `BB迪拜`, `卡兹拉德罗普`, and `MoonCancer`. |

Counts are prep observations only. Downstream Generator/Auditor agents must recount from line-addressable source text and handle mismatches as audit issues.

## Excluded from Formal Facts

The following are excluded from formal story facts unless later explicitly classified as engine/rule metadata outside canon facts:

- EJS controller entries
- MVU variable update entries
- sandbox or roleplay engine rules
- agent inference
- summary-only claims
- model memory, game memory, or wiki impressions
- previous pilot outputs
- old curated files

## Mandatory Visual / Ability / Combat Rule

Every Ordeal Call packet must extract appearance / ability / combat-effect details source-first:

- If the source explicitly says it, create a source-backed record.
- If the source does not explicitly say it, create `not-found-in-source` records.
- Never fill missing costume, equipment visual, Noble Phantasm, skill, magecraft, authority, transformation, summoning, or combat animation details from outside knowledge.
- Every formal downstream record must carry `sourceRefs`, `sourceType`, `credibility`, and `canonStatus` where applicable.

## Formal Store Rule

Do not create formal aggregate `characters.json`, `events.json`, or `relationships.json` fact stores. Downstream formal facts must be split into per-entity, per-event, or per-edge files with indexes only as indexes.

## Merge Retention Rule

Later merge must retain event `triggerRaw`, `completionRaw`, and `summaryRaw` when present or explicitly mark them not found in source. Relationship edge records must retain `timelineId` and `timeRange`; do not publish static relationship edges without temporal scoping.

## Terminology Rule

No unsupported formal labels may be introduced. Preserve source-first raw Chinese terminology from the worldbook, and record normalized IDs or alternate labels only as candidates unless the current source supports them directly.

## Blocking Status

No missing, duplicated-entry, split-entry, or ambiguous-entry blocker was found for the requested target entries.
