# FGO Lostbelt 6.1-6.2 P1 Prep Gate

Status: prep gate prepared only; source text, extraction, normalization, merge, graph, timeline, and publication are not started.

This isolated pilot prepares the Lostbelt 6 batch for the Type-Moon FGO script p1 pipeline. It identifies LB6.1 Avalon pre and LB6.2 Round Table post source entries from the FGO worldbook and creates only source inventory, source classification, source-unit manifest, locked plan, status, execution log, and two Lostbelt work packets.

## Scope

Primary source:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

Selected entries:

- Entry 100: `FGO_LB6_1_阿瓦隆前篇` / Lostbelt No.6 妖精圆桌领域 阿瓦隆·勒·菲（前篇）
- Entry 117: `FGO_LB6_2_圆桌后篇` / Lostbelt No.6 妖精圆桌领域 阿瓦隆·勒·菲（后篇）

Allowed write root:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-lb6-pilot/
```

## Prepared Artifacts

- `README.md`
- `PLAN.locked.md`
- `STATUS.md`
- `source-inventory.json`
- `source-classification-report.md`
- `source-unit-manifest.json`
- `execution-log.md`
- `work-packets/lostbelt/lb6-1-avalon-pre.json`
- `work-packets/lostbelt/lb6-2-round-table-post.json`

Exactly two Lostbelt work packets are expected under `work-packets/lostbelt/`.

## Source Evidence

- Entry 100 is present at `[沙盒]FGO 0.8.worldbook.json:12931-12936`, with mirror/raw copy observed at `12975-12976`.
- Entry 117 is present at `[沙盒]FGO 0.8.worldbook.json:15082-15087`, with mirror/raw copy observed at `15126-15127`.
- Both selected entries contain `<world_state>`, `<stage_characters>`, and `<world_timeline>` sections.

## Locked Rules

- Required model for later execution agents: `lt-yuyu/gpt-5.5`.
- If the required model is unavailable, downstream work is blocked; no automatic downgrade is allowed.
- No bash, shell, python, node, deno, powershell, cmd, or executable script tools are permitted.
- Source type is `user-file-worldbook-script`; canon status is `canon-like`; credibility is `B`.
- These worldbook entries are not official canon text and must not be labeled `canon-text` or `official-script`.
- Source-first extraction is mandatory. Summary/profile/curated mirrors may not overwrite script-primary facts.
- Every formal downstream record must carry `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.
- Appearance, outfit/equipment visuals, abilities, Noble Phantasms, skills, magecraft, authorities, transformations, summoning, combat effects, visual effects, targets, results, costs, and consequences are mandatory extraction layers.
- If mandatory appearance / ability / combat-effect details are not explicit in source, downstream workers must create `not-found-in-source` records rather than silently omitting the layer.
- No game memory, wiki impression, or model knowledge may fill missing visual, ability, or combat details.
- No unsupported formal labels may be introduced; preserve source-first Chinese terminology and keep normalized IDs as candidates unless source-supported.
- No formal aggregate `characters.json`, `events.json`, or `relationships.json` may be created as the fact store.
- Later merge must retain event `triggerRaw`, `completionRaw`, and `summaryRaw` from source-backed event records.
- Later relationship edge records must retain `timelineId` and `timeRange`; do not publish static relationship edges without temporal scoping.
- Each packet must run `Generator -> Auditor -> Fixer -> Auditor rerun` until passed with zero open or blocked issues.

## Current Gate

Prep gate is ready for source-text build only. Extraction remains closed until line-addressable source text is created in a later approved stage and each packet enters the required audit/fix loop.
