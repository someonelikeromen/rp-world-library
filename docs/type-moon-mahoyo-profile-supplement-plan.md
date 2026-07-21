# Type-Moon Mahoyo Profile Supplement Plan

## Status

- Current phase: Stage 0 inventory completed; Stage 1 not started.
- Inventory run: `r58` / `mahoyo-source-inventory-audit`.
- Recommended pilot directory:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/mahoyo-profile-supplement-pilot/
```

This plan documents the full follow-up roadmap. It does not authorize automatic execution; each execution stage still requires a confirmed plan before agent launch or writing new archive layers.

## 1. Goal

Create a side-by-side Type-Moon p1-hybrid profile supplement for **魔法使之夜 / Mahoyo / Witch on the Holy Night**.

The pilot should archive source-backed profile, setting, ability, appearance, combat-signal, relationship, and relative timeline material from available local Type-Moon worldbooks while preserving provenance and uncertainty.

The output is a manual-curation supplement, not a replacement for the existing Type-Moon curated archive.

## 2. Non-goals

This pilot must not:

- Overwrite `campaigns/world-library/worlds/type-moon-nasuverse/curated/`.
- Modify raw source worldbook imports.
- Publish Mahoyo into the formal Type-Moon archive.
- Build Type-Moon core/general settings; those remain deferred.
- Claim official canon p1-scan status.
- Infer missing VN script scenes, exact dates, dialogue, CG descriptions, or combat ordering from model memory.
- Merge all cross-work Aoko/Touko facts into one static Mahoyo profile.
- Promote FGO-collab, Tsukihime, Kara no Kyoukai, Case Files, FSN, or 2015 Clock Tower material into Mahoyo main continuity unless the source explicitly supports it.

## 3. Source Registry and Credibility Policy

### Primary source

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/奇妙的世界书DLC_型月篇2026_0126.worldbook.json
```

Use as the main Mahoyo worldbook-backed source.

Recommended metadata:

```json
{
  "sourceType": "user-file-worldbook",
  "credibility": "B or B-",
  "canonStatus": "canon-like/adapted/unknown per fact"
}
```

Supported clusters include:

- 苍崎青子
- 久远寺有珠
- 静希草十郎
- 苍崎橙子
- 三咲町 / 三咲市
- 久远寺宅邸
- 私立三咲高等学校
- 礼园女学院
- 第五魔法 / 魔法·青
- 魔弹
- PLOY / 童话怪物
- 贝奥武夫
- Mahoyo summary-level plot skeleton
- major relationships and combat/ability signals

### Secondary support source

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json
```

Use only for broad Type-Moon magic support, especially:

- 五大魔法
- 第五魔法
- 魔法·青
- 苍崎青子 as Fifth Magic user

Recommended metadata:

```json
{
  "sourceType": "user-file-worldbook",
  "credibility": "B- or C+",
  "canonStatus": "canon-like/adapted/unknown",
  "scopeLimit": "general magic support only"
}
```

### Candidate cross-source

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

Use only for candidate/cross-source Touko/Rune material unless a later confirmed plan expands scope.

Recommended metadata:

```json
{
  "sourceType": "user-file-worldbook",
  "credibility": "B-/C+",
  "canonStatus": "candidate-only/source-gap",
  "scopeLimit": "cross-work corroboration only"
}
```

## 4. Continuity Taxonomy

All Mahoyo records must include continuity or an equivalent variant/period field.

Recommended taxonomy:

```text
mahoyo-main
mahoyo-remaster
type-moon-general
tsukihime-linked
kara-no-kyoukai-linked
case-files-linked
fsn-linked
fgo-collab
2015-clock-tower
mixed
sandbox
source-gap/candidate-only
```

Rules:

- `mahoyo-main` is only for Mahoyo-backed profile/setting/plot material.
- Aoko and Touko must be periodized / variant-separated.
- Cross-work material can be linked with `relatedForms`, `crossWorkLinks`, or candidate records, but cannot silently merge into Mahoyo main.
- FGO-collab material must remain `fgo-collab` or `candidate-only` unless separately scoped.
- Informal, humorous, slang, or mock labels must remain `aliasCandidates` or `unsupported-by-current-source`.

## 5. Required Metadata for Records

Formal or semi-formal records require:

```json
{
  "sourceRefs": [],
  "sourceType": "user-file-worldbook",
  "credibility": "B/B-/C+",
  "canonStatus": "canon-like/adapted/unknown/source-gap",
  "continuity": "mahoyo-main or another declared taxonomy value",
  "candidateOnly": false
}
```

If evidence is insufficient, use one of:

```text
not-found-in-source
source-gap
candidate-only
unsupported-by-current-source
```

Do not infer missing official facts.

## 6. Forbidden Basenames

No formal or supplement output may use these aggregate filenames:

```text
characters.json
events.json
relationships.json
facts.json
graph.json
timeline.json
```

Timeline and graph outputs must use derived-only names such as:

```text
timeline/derived-index.json
graph/derived-index.json
```

## 7. Packet Plan

### packet-001-source-inventory-and-source-text

Purpose:

- Select source entries from DLC, 型月(1), and optional FGO sandbox candidate.
- Build line-addressable source text.
- Deduplicate `content` vs `raw.content` repeated material.
- Create source manifest and packet manifest.

### packet-002-canonical-id-and-continuity

Purpose:

- Define canonical IDs and alias candidates.
- Separate Aoko/Touko cross-work variants.
- Create `doNotMergeWith`, `relatedForms`, continuity and period rules.

Key risks:

- Aoko in Mahoyo vs Tsukihime/Melty/2015.
- Touko in Mahoyo vs Kara no Kyoukai / Case Files / FSN.

### packet-003-core-characters

Targets:

- 苍崎青子
- 久远寺有珠
- 静希草十郎
- 苍崎橙子

Required layers:

- profile identity
- appearance/outfit signals
- ability signals
- relationship refs
- continuity / period metadata

### packet-004-location-and-institutions

Targets:

- 三咲町 / 三咲市
- 久远寺宅邸
- 私立三咲高等学校
- 礼园女学院
- 苍崎家
- 久远寺家
- local shop/church/school surfaces only if source-backed

### packet-005-mahoyo-plot-skeleton

Targets:

- Aoko inheritance / role shift
- cohabitation with Alice/Soujuurou
- magic secrecy / witness incident
- amusement park / Flat Snark
- Touko conflict
- Beowulf confrontation
- Soujuurou death / near-death signal
- Fifth Magic activation
- Touko defeat / curse
- memory decision / epilogue signal

Only summary-level relative timeline is allowed unless source text has stronger evidence.

### packet-006-abilities-and-activation

Targets:

- Aoko: 魔弹, 星雷/星弓 if source-backed, 第五魔法, chant, redshift/future-state, cost/effect.
- Alice: PLOY / Kickshaw, Mystic Eyes, Cock Robin, Thames Troll, Flat Snark, Rose Hound, other named PLOYs.
- Soujuurou: body-control combat, Beowulf feat, self-injury/cost.
- Touko: runes, dolls, Mystic Eyes, Beowulf familiar, projection/box tools.

### packet-007-appearance-outfit-equipment

Targets:

- Aoko school/home/outdoor/fifth-magic states.
- Alice uniform/home/outdoor/winter attire.
- Soujuurou school/outdoor wear, scars, neck bandage, collar.
- Touko orange motif, glasses, cigarette, Magic Eye Killer, dolls, rune tools, familiars.

If exact scene visuals are absent, write not-found/source-gap rather than infer.

### packet-008-relationships

Targets:

- Aoko ↔ Alice
- Aoko ↔ Soujuurou
- Alice ↔ Soujuurou
- Aoko ↔ Touko
- Alice ↔ Touko
- Touko ↔ Beowulf
- Aozaki grandfather / family relations
- Mei/Liddell/Ritsuka/collab links only as secondary/candidate where applicable

Relationships must include source refs and continuity/time range where possible.

### packet-009-candidate-only-cross-work-continuity

Targets:

- Aoko/Touko in Tsukihime, Kara no Kyoukai, Case Files, FSN HF, Melty Blood, FGO collab, 2015 Clock Tower.
- Kuzuki/Soujuurou meta-production relation if retained.
- FGO Mahoyo collab mechanics.

This packet is explicitly candidate/source-gap unless stronger source evidence is introduced.

## 8. Execution Roadmap

### Stage 1: Prep / Source Layer

Allowed outputs:

```text
STATUS.md
source-unit-manifest.json
sources/worldbook-profile/source-text-manifest.json
sources/worldbook-profile/*.txt
work-packets/*.json
audit/prep/*
```

Forbidden at Stage 1:

```text
extracted/
normalized/
merged/
graph/
timeline/
```

Loop:

```text
Stage 1 Generator
→ Stage 1 read-only Auditor
→ Fixer if failed-blocking
→ Auditor rerun
```

Gate:

```json
{
  "status": "passed or passed-with-nonblocking-risks",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true
}
```

### Stage 2: Packet Extraction / Normalization

Suggested waves:

Wave 1:

```text
packet-002-canonical-id-and-continuity
packet-003-core-characters
packet-004-location-and-institutions
```

Wave 2:

```text
packet-005-mahoyo-plot-skeleton
packet-006-abilities-and-activation
packet-007-appearance-outfit-equipment
```

Wave 3:

```text
packet-008-relationships
packet-009-candidate-only-cross-work-continuity
```

Per-packet outputs:

```text
extracted/profile-supplement/<packet>/
normalized/profile-supplement/<packet>/
audit/packet-audits/<packet>/
```

Every packet requires:

```text
Generator → Auditor → Fixer if blocking → Auditor rerun
```

### Stage 3: Gate Evidence / Merge Readiness

Before merge, every packet must have project-local gate evidence:

```json
{
  "status": "passed",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true
}
```

If external agent artifacts show pass but project files do not, run:

```text
Gate Evidence Fixer → Merge-readiness Auditor rerun
```

Parent must not manually write final gate evidence.

### Stage 4: Controlled Merge

Allowed outputs:

```text
merged/profile-index.json
merged/profile-records/*/*.json
merged/appearance-signals/index.json
merged/ability-signals/index.json
merged/combat-effect-signals/index.json
merged/relationship-signals/index.json
merged/not-found/index.json
timeline/derived-index.json
graph/derived-index.json
audit/merge/merge-report.json
audit/final/final-status.json
```

Rules:

- Merge only passed packet outputs.
- Keep side-by-side supplement status.
- Preserve source metadata and continuity separation.
- Keep candidate-only/source-gap marked.
- Timeline/graph must declare derived-only and primaryFactStore false.

### Stage 5: Final Audit

Independent read-only Final Auditor checks:

- Stage 1 and Stage 2 gates.
- Merge inputs come only from passed packets.
- No forbidden basenames.
- No old curated/raw import/other pilot mutation.
- Worldbook source is not mislabeled official canon.
- Aoko/Touko cross-work continuity remains separated.
- Candidate-only/source-gap records are not promoted.

Expected terminal state:

```text
accepted-with-nonblocking-risks
not-published
curatedMutation: none
```

### Stage 6: Future Enhancements

Backlog only, not part of current pilot:

```text
mahoyo-script-pilot
mahoyo-material-book-supplement
mahoyo-official-scene-timeline
mahoyo-combat-scene-expanded-layer
```

## 9. Nonblocking Risks Expected

Even if the pilot passes, it should carry these risks:

- Source evidence is local worldbook/profile excerpts, not official VN script.
- Event ordering is summary-level and mostly relative-only.
- Exact dates/dialogue/scene visuals remain source-gap.
- Some cross-work material must remain candidate-only.
- Informal source labels may remain aliases but not formal titles.

## 10. Next Allowed Step

After user confirmation, run:

```text
Stage 1 Prep / Source Layer Generator → read-only Auditor
```

No Stage 1 execution is authorized by this plan file alone.
