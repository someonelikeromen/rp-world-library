# Locked Plan: FGO Epic of Remnant P1 Pilot Preparation

Date: 2026-07-12

## Objective

Prepare only the EoR pilot scaffold, source inventory, source-unit manifest, execution log, and exactly four EoR chapter-extraction work packets for entries 89-92 of `[沙盒]FGO 0.8.worldbook.json`.

## Mutation boundary

Allowed write root for this preparation:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-eor-pilot/
```

Forbidden write targets:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/
campaigns/world-library/worlds/type-moon-nasuverse/curated/
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/
docs/
.pi/skills/
```

## Primary source

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

Selected entries:

| entryIndex | chapterId | slug | comment | estimated events | estimated quotes |
|---:|---|---|---|---:|---:|
| 89 | `fgo-eor-shinjuku` | `shinjuku` | `FGO_亚种特异点I_新宿` | 19 | 27 |
| 90 | `fgo-eor-agartha` | `agartha` | `FGO_亚种特异点II_雅戈泰` | 17 | 32 |
| 91 | `fgo-eor-shimousa` | `shimousa` | `FGO_亚种特异点III_下总国` | 17 | 36 |
| 92 | `fgo-eor-salem` | `salem` | `FGO_亚种特异点IV_塞勒姆` | 12 | 22 |

The quote counts are plan estimates; later Generator/Auditor agents must recount from line-addressable source text and preserve every source dialogue line or a source-backed skipped reason.

## Source classification

- Primary script entries: `script-like`, `sourceType: user-file-worldbook-script`, `canonStatus: canon-like`, `credibility: B`.
- Summary worldbook and character-profile sources: cross-check/supplement only, not event primary.
- EJS/MVU/engine/sandbox rules: excluded from formal story facts.

## Required extraction layers

Every chapter packet must require source-first extraction of:

1. `world_state`
2. `stage_characters`
3. all raw `-事件X` timeline events
4. characters and observed roles/status
5. relationship signals and candidate relationship edges
6. dialogue refs for every quoted line or a source-backed skipped reason
7. appearance descriptions, outfit/equipment visuals, and visual traits when explicitly present
8. abilities, Noble Phantasms, skills, magecraft, authorities, transformations, summoning, and similar activations when explicitly present
9. combat effects, visual effects, results, targets, costs, consequences, and state changes when explicitly present
10. `not-found-in-source` records for required appearance / ability / combat-effect fields when the source lacks explicit detail
11. raw time, trigger, completion, raw event code, title, orderIndex, and sourceRefs

## Packet contract

Each work packet must require:

- one file per raw timeline event;
- per-character observed fragments or mentions;
- relationship signal/candidate extraction with no co-occurrence promotion to formal graph;
- extracted appearance, ability/Noble Phantasm/skill, and combat-effect signal layers;
- explicit `not-found-in-source` records for missing mandatory visual/ability/combat detail;
- `sourceRefs`, `sourceType`, `credibility`, and `canonStatus` on formal records;
- valid JSON outputs;
- no source import or old curated modification.

## Agent loop

Each packet must run:

```text
Generator -> Auditor -> Fixer -> Auditor rerun
```

The loop is unlimited and may advance only when all conditions are true:

```text
final-status.status == passed
openIssues == 0
blockedIssues == 0
latestAudit.status == passed
canAdvance == true
```

`failed`, `partial`, `blocked`, open issues, blocked issues, or non-passed latest audits must not advance.

## Model and tool constraints

Required model for every later execution agent:

```text
lt-yuyu/gpt-5.5
```

If unavailable, execution is blocked; do not auto-downgrade.

Forbidden tools:

```text
bash
shell
python
node
deno
powershell
cmd
any executable script invocation
```

Allowed later tools are only controlled read/write/edit and structured JSON tools. Auditor agents are read-only.

## Gate

This preparation stage is complete only after the seven named scaffold artifacts and exactly four `work-packets/eor/*.json` files are written and read back. No extraction, normalization, merge, graph, timeline, source import change, or old curated change is authorized by this prep stage.
