# Type-Moon Nasuverse — Extracted Layer

This directory is the formal `pi/world_query`-oriented extracted layer for the Type-Moon p1-hybrid manual-curation pilots.

## Scope

- Source root: `campaigns/world-library/manual-curation/type-moon-p1-hybrid/`
- Destination root: `campaigns/world-library/worlds/type-moon-nasuverse/extracted/`
- World id: `type-moon-nasuverse`
- Publication date: `2026-07-20`
- Publication mode: source-linked indexes plus representative shard records.

The old curated archive and raw imports were not modified. This extracted layer does not replace `campaigns/world-library/worlds/type-moon-nasuverse/curated/`.

## Query entry points

- `manifest.json` — publication manifest and pilot registry.
- `sources/index.json` — source-pilot and source-manifest registry.
- `characters/index.json` — formal character/entity record families and representative records.
- `events/index.json` — formal event record families and representative records.
- `relationships/index.json` — formal relationship-edge record families and representative records.
- `rules/index.json` — formal settings/rules records.
- `locations/index.json` — formal location/context records.
- `abilities/index.json` — formal ability/appearance/combat-effect signal records.
- `organizations/index.json` — formal organization/institution anchors.
- `items/index.json` — item/mechanics/equipment-oriented record families.
- `timelines/derived-timeline-index.json` — derived timeline references only.
- `graphs/derived-graph-index.json` — derived graph references only.
- `candidates/index.json` — candidate-only records excluded from default formal retrieval.
- `source-gaps/index.json` — source-gap and blocked inventories excluded from default formal retrieval.
- `audits/publication-inventory.md` and `audits/publication-inventory.json` — publication audit and inventory.

## Publication policy

Formal indexes include only pilots with terminal passed/accepted status or accepted-with-nonblocking-risks evidence. Formal records preserve `sourceRefs`, `sourceType`, `credibility`, `canonStatus`, `continuityScope`, `candidateOnly`, `sourceGap`, and audit metadata.

Candidate-only, source-gap, blocked, redacted, or human-scope material is not promoted into formal character/event/relationship/rule/location/ability facts. It is retained under `candidates/` and `source-gaps/` for transparency.

## Explicit hold/exclusion decisions

- `fate-spinoff-profile-supplement-pilot`: retained as source-gap inventory only.
- `tsukihime-supporting-cast-candidate-supplement-pilot`: retained as candidate-only/source-gap only.
- `tsukihime-dead-apostle-profile-supplement-pilot`: held from formal publication because final status evidence conflicts with a pending final audit marker.
- `mahoyo-profile-supplement-pilot`: held from formal publication because status evidence says the fixer retry is pending a read-only auditor rerun.
- Atlas/Sion human-scope continuity: retained as candidate/source-gap only.
- Type Lumina-specific gaps: retained as source gaps only.
- Prisma unsafe/redacted underage adult-content sections: retained only as safety/source-gap metadata, not formal facts.
- Cross-work Sitonai/Shidounai/Prisma-FSN identity surfaces: retained as candidate-only continuity separation metadata.

## Derived graph/timeline policy

Graph and timeline files in this layer are derived indexes. They point to source-backed record IDs or accepted pilot artifacts and are not primary fact stores.
