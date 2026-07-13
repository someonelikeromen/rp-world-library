# FGO Lostbelt 3-4 P1 Prep Gate

Status: prep gate prepared only; source text, extraction, normalization, merge, graph, timeline, and publication are not started.

This isolated pilot prepares the Lostbelt 3-4 batch for the Type-Moon FGO script p1 pipeline. It identifies the LB3 and LB4 source entries from the FGO worldbook and creates only source inventory, source classification, source-unit manifest, locked plan, status, execution log, and two Lostbelt work packets.

## Scope

Primary source:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

Selected entries:

- Entry 95: `FGO_LB3_人智统合真国` / Lostbelt No.3 人智统合真国 琴（红之月下美人）
- Entry 96: `FGO_LB4_创世灭亡轮回` / Lostbelt No.4 创世灭亡轮回 游迦·俱卢（黑色最后之神）

Allowed write root:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-lb3-lb4-pilot/
```

## Prepared Artifacts

- `README.md`
- `PLAN.locked.md`
- `STATUS.md`
- `source-inventory.json`
- `source-classification-report.md`
- `source-unit-manifest.json`
- `execution-log.md`
- `work-packets/lostbelt/lb3-renzhi-tonghe-zhenguo.json`
- `work-packets/lostbelt/lb4-chuangshi-miewang-lunhui.json`

Exactly two Lostbelt work packets are expected under `work-packets/lostbelt/`.

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
- Each packet must run `Generator -> Auditor -> Fixer -> Auditor rerun` until passed with zero open or blocked issues.

## Current Gate

Prep gate is ready for source-text build only. Extraction remains closed until line-addressable source text is created in a later approved stage and each packet enters the required audit/fix loop.
