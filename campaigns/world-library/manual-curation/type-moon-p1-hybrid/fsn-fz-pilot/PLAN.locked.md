# PLAN.locked.md — Type-Moon P1-Hybrid FSN/FZ Pilot

Locked on: 2026-07-12
Pilot root: `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/`
Model required for later subagents: `lt-yuyu/gpt-5.5`

This file is the local locked plan summary for the FSN/FZ pilot. It reflects the approved plan in `docs/type-moon-p1-hybrid-archive-plan.md` and the skill rules in `.pi/skills/type-moon-p1-hybrid-archive/SKILL.md`.

## Objective

Use Fate/stay night / Fate/Zero as a pilot to validate a p1-plan / p1-scan-style closed-loop archive flow for the Type-Moon world library.

Because the available sources are imported worldbooks and curated story summaries rather than official novel/game scripts, the pilot must be labeled **p1-hybrid**. Outputs must not be described as official canon source-backed p1-scan.

## Non-overwrite rule

The existing curated archive is read-only for this pilot:

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/
```

No step may overwrite it. A future `curated-v2` preview or migration may only be considered after explicit user confirmation.

## Approved pilot output root

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/
```

## Approved source layers

Formal pipeline layers:

```text
source text
→ wave extraction
→ merged formal entities/events/relationships
→ graph/timeline derived layers
→ audit/comparison reports
```

Pilot-recognized directories/layers:

```text
sources/
waves/
intermediate/
group-merged/
merged/
candidates/
audit/
comparison/
```

Candidate and formal outputs must remain separated.

## Included source pools

Approved inclusion boundary:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/Fate stay night.worldbook.json
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/FateStayNight - 沙盒's Lorebook.worldbook.json
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/fatezero.worldbook.json
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/*.md
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json filtered to FSN/FZ/冬木/圣杯战争/御三家-related entries
```

Temporarily excluded:

```text
FGO mainline large-scale entries
妖精国历
Prisma Illya
月姬、空境、魔法使之夜 expansion
original-full-* derived layers, except as comparison material
```

## Credibility and canon-status rules

All formal facts must carry fields equivalent to:

```json
{
  "sourceRefs": [],
  "sourceType": "user-file-worldbook|curated-story-derived",
  "credibility": "A|B|C|D|E",
  "evidenceLevel": "A|B|C|D|E",
  "canonStatus": "canon|canon-like|adapted|sandbox|inference|unknown"
}
```

No `agent-inference` may enter formal entities/events/relationships/graphs. Inference may only enter candidates.

## Continuity and variant rules

Every entity must preserve continuity/version boundaries. Same names do not imply same entity.

Required distinction examples:

- `illyasviel-fsn != prisma-illya-01`
- `emiya-shirou` and `archer-emiya` are related but not directly merged without manifest authorization.
- `saber-artoria` and other Artoria forms use `relatedForms`/variants, not blind merging.

Required support fields include:

```json
{
  "continuity": "fsn|fz|fgo|prisma|tsukihime|kara-no-kyoukai|mahoyo|mixed|unknown",
  "timelineId": "fsn-main|fz-fourth-war|...",
  "variantId": "fsn-base|fz-young|hf-corrupted|ubw-route|fate-route",
  "isSameEntityAs": [],
  "relatedForms": [],
  "doNotMergeWith": []
}
```

## Graph rules

Formal graph nodes must use this type set only:

```text
character
faction
location
concept
system
ability
item
event
timeline-period
world-rule
```

Co-occurrence may only create candidates. A formal relationship edge requires non-empty `sourceRefs`, `confidence >= medium`, and `reviewStatus = audited`.

## Timeline rules

Events must include `time.start`, `time.end`, and for long events `timelineNodes` with start/middle/end. Unknown dates must not be invented. Use relative-only time when necessary:

```json
{
  "value": null,
  "precision": "relative-only",
  "relative": "Fate route early phase",
  "orderIndex": 120
}
```

Recommended order index bands:

```text
000-099  Fate/Zero prehistory and Fourth Holy Grail War
100-199  FSN common route
200-299  Fate route
300-399  UBW route
400-499  HF route
900-999  epilogues/end states
```

Core characters must be versioned with `periods[]`, including timeline/route/status/knowledge/relationship changes.

## Required wave plan

The approved pilot uses eighteen waves:

1. `wave-001` — Source Inventory + dedupe scan
2. `wave-002` — Canonical ID Manifest initial pass
3. `wave-003` — FSN worldline and Holy Grail War base rules
4. `wave-004` — Masters and human characters
5. `wave-005` — Servants and heroic spirits
6. `wave-006` — Organizations, families, factions
7. `wave-007` — Locations
8. `wave-008` — Abilities, magecraft, Noble Phantasms
9. `wave-009` — Fate route event decomposition
10. `wave-010` — UBW route event decomposition
11. `wave-011` — HF route event decomposition
12. `wave-012` — Fate/Zero and Fourth Holy Grail War
13. `wave-013` — Sandbox rules and engine-rule stratification
14. `wave-014` — Relationship candidates and formal relationship audit
15. `wave-015` — FSN/FZ timeline skeleton
16. `wave-016` — Event time annotation review
17. `wave-017` — Character periods versioning
18. `wave-018` — Time-aware relationship graph

## Closed-loop gate

Every wave and later merge/graph/timeline stage must iterate until passed:

```text
Generator → Auditor → Fixer → Auditor rerun
```

No stage may advance while status is `failed`, `partial`, `blocked`, `open-issues > 0`, or latest audit is not `passed`.

`known-issues.json` records blockers only; it is not a bypass.

## Later subagent authority

All later subagents must explicitly set:

```json
{
  "agent": {
    "model": "lt-yuyu/gpt-5.5"
  }
}
```

No implicit default model. No auto downgrade if unavailable.

Subagents must not use bash/shell/python/node/deno/powershell/cmd or any executable script call. Auditor-class agents are read-only and may only emit audit reports.

## Prep-stage stop condition

This `prep-source` run stops at scaffold/prep artifacts. It does not build `sources/`, does not create source text, and does not start waves.

Recommended next confirmed run: Phase 0 source-text construction only, followed by Source-Audit/Fix before wave extraction.
