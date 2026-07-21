# Type-Moon Nasuverse Extracted Publication Inventory

Publication step: `extracted-publisher`  
World: `type-moon-nasuverse`  
Source root: `campaigns/world-library/manual-curation/type-moon-p1-hybrid/`  
Destination root: `campaigns/world-library/worlds/type-moon-nasuverse/extracted/`  
Publication date: `2026-07-20`

## Scope and method

This extracted layer publishes the completed Type-Moon p1-hybrid manual-curation outputs into a formal `pi/world_query`-oriented layer. Because converting every detailed accepted artifact would be too large for this isolated pass, the layer uses unified source-linked indexes plus representative shard records that point back to accepted pilot artifacts with audit metadata.

No raw import file, old curated file, or manual-curation pilot artifact was intentionally modified. Writes were confined to:

```text
campaigns/world-library/worlds/type-moon-nasuverse/extracted/**
```

Machine JSON parsing was not run because the task prohibited shell/script/code execution tools. Validation here is based on direct read/list/find inspection and careful JSON authoring.

## Required files created

- `README.md`
- `manifest.json`
- `audits/publication-inventory.md`
- `audits/publication-inventory.json`
- `sources/index.json`
- `characters/index.json`
- `events/index.json`
- `relationships/index.json`
- `rules/index.json`
- `locations/index.json`
- `abilities/index.json`
- `organizations/index.json`
- `items/index.json`
- `timelines/derived-timeline-index.json`
- `candidates/index.json`
- `source-gaps/index.json`

Additional support files:

- `graphs/derived-graph-index.json`
- `characters/shards/representative-character-records.json`
- `events/shards/representative-event-records.json`
- `relationships/shards/representative-relationship-records.json`
- `candidates/shards/candidate-boundary-records.json`
- `source-gaps/shards/source-gap-boundary-records.json`

## Formal publication decisions

Published formally as source-linked indexes and representative shards:

| Pilot | Publication decision | Evidence retained |
|---|---|---|
| `fsn-fz-pilot` | Formal source-linked indexes | `audit/final-pass-report.json`, `merged/index.json`, `merged/merged-entities.json`, `merged/merged-graph.json`, `merged/merged-timeline.json` |
| `fgo-script-pilot` | Formal FGO Part 1 indexes | `STATUS.md`, accepted `merged/`, `graph/`, `timeline/` outputs |
| `fgo-eor-pilot` | Formal EoR indexes | `STATUS.md`, accepted `merged/`, `graph/`, `timeline/eor/` outputs |
| `fgo-lb1-lb2-pilot` | Formal Lostbelt 1-2 indexes | `STATUS.md`, accepted `merged/`, `graph/`, `timeline/` outputs |
| `fgo-lb3-lb4-pilot` | Formal Lostbelt 3-4 indexes | `STATUS.md`, accepted `merged/`, `graph/`, `timeline/` outputs |
| `fgo-lb5-pilot` | Formal Lostbelt 5 indexes | `STATUS.md`, accepted `merged/`, `graph/`, `timeline/` outputs |
| `fgo-lb6-pilot` | Formal Lostbelt 6 indexes | `STATUS.md`, accepted `merged/`, `graph/`, `timeline/` outputs |
| `fgo-ordeal-call-pilot` | Formal event/relationship/world-state indexes; packet signal coverage referenced only | `STATUS.md`, `merged/`, `graph/`, `timeline/`, packet `normalized/**/signal-index.json` refs |
| `kara-no-kyoukai-profile-supplement-pilot` | Formal profile/settings indexes | `STATUS.md`, `merged/profile-index.json`, `normalized/profile-supplement/`, `graph/derived-index.json`, `timeline/derived-index.json` |
| `prisma-illya-profile-supplement-pilot` | Formal SFW redacted profile/mechanics indexes | `STATUS.md`, `normalized/profile-supplement/prisma-illya/`, `graph/derived-index.json`, `timeline/derived-index.json` |
| `lb6-fairy-calendar-supplement-pilot` | Formal relative-only calendar/settings indexes | `STATUS.md`, `normalized/calendar-setting/`, `graph/derived-index.json`, `timeline/derived-index.json` |
| `type-moon-core-general-settings-pilot` | Formal noncandidate settings anchors only | `STATUS.md`, `audit/final-status.json`, `normalized/core-general-settings/index.json` |

## Held, candidate-only, or source-gap decisions

The following were **not** promoted into formal facts:

- `fate-spinoff-profile-supplement-pilot`: `blocked-insufficient-source`; inventory only under `source-gaps/index.json`.
- `tsukihime-supporting-cast-candidate-supplement-pilot`: candidate-only/source-gap; no formal characters, events, relationships, graph, or timeline facts.
- `tsukihime-dead-apostle-profile-supplement-pilot`: held because `audit/final/final-status.json` reports `merge-generated-pending-audit`, `canAdvance: false`.
- `mahoyo-profile-supplement-pilot`: held because `STATUS.md` reports fixer retry completed but read-only auditor rerun pending.
- Atlas/Sion human-scope continuity: retained as candidate/source-gap only; no merged institution record.
- Type Lumina-specific Tsukihime cast/roster material: retained as source-gap only.
- Prisma unsafe underage adult-content: redacted/excluded and represented only as safety/source-gap metadata.
- Cross-work Sitonai/Shidounai and Prisma/FSN Illya identity surfaces: retained as candidate-only/source-gap or separation metadata.
- Unsupported aliases/common labels not in current source: candidate-only/legacy-slug metadata only, not source-backed formal labels.

## Derived graph and timeline policy

`graphs/derived-graph-index.json` and `timelines/derived-timeline-index.json` are derived indexes. They point to accepted source-backed primary record families and pilot artifacts. They are not primary fact stores and should not be used to promote candidate-only or source-gap material.

## Metadata preservation

The publication indexes preserve these fields or policies at the family/record level:

- `worldId`
- `sourcePilot` / `pilotId`
- `recordId` / `familyId`
- `recordType`
- `continuityScope`
- `sourceRefs`
- `sourceType`
- `credibility`
- `canonStatus`
- `candidateOnly`
- `sourceGap`
- audit status references and nonblocking-risk notes

## Forbidden basename audit

Find checks were performed after writing for these forbidden basenames under the extracted layer:

- `characters.json`: no matches
- `events.json`: no matches
- `relationships.json`: no matches
- `facts.json`: no matches
- `graph.json`: no matches
- `timeline.json`: no matches

## Known limitations

- This layer does not copy every accepted record from the manual-curation pilots; it publishes source-linked indexes and representative shards.
- No executable JSON parser was run due to the task restrictions.
- Accepted pilots retain their documented nonblocking risks and are not approved replacements for the legacy curated archive.
