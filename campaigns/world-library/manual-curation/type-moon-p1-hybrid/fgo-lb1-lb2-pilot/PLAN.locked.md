# Locked Plan: FGO Lostbelt 1-2 P1 Prep Gate

Date: 2026-07-12
Step id: `prep-lb1-lb2`
Pilot root: `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-lb1-lb2-pilot/`
Required model for later execution agents: `lt-yuyu/gpt-5.5`

## Objective

Prepare only the Lostbelt 1-2 prep gate scaffold, source inventory, source classification report, source-unit manifest, execution log, status, and two chapter-extraction work packets for entries 93-94 of `[沙盒]FGO 0.8.worldbook.json`.

This plan does not authorize source text construction, chapter extraction, normalization, merge, graph, timeline, publication, or modification of imports / old curated outputs.

## Mutation Boundary

Allowed write root:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-lb1-lb2-pilot/
```

Forbidden write targets:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-eor-pilot/
campaigns/world-library/worlds/type-moon-nasuverse/curated/
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/
docs/
.pi/skills/
```

## Primary Source

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

| entryIndex | chapterId | slug | comment | observed events | observed quotes | direct sourceRef |
|---:|---|---|---|---:|---:|---|
| 93 | `fgo-lb1-anastasia` | `lb1-anastasia` | `FGO_LB1_安娜塔西亚` | 24 | 40 | `[沙盒]FGO 0.8.worldbook.json:12074-12075` |
| 94 | `fgo-lb2-gotterdammerung` | `lb2-gotterdammerung` | `FGO_LB2_诸神黄昏` | 19 | 30 | `[沙盒]FGO 0.8.worldbook.json:12197-12198` |

Counts are prep observations from the worldbook entry content. Downstream Generator/Auditor agents must recount from line-addressable source text and treat any mismatch as an audit item.

## Source Classification

- Primary script entries: `script-like`, `sourceType: user-file-worldbook-script`, `canonStatus: canon-like`, `credibility: B`.
- Summary worldbook and character-profile sources: cross-check/supplement only, not event primary.
- EJS/MVU/engine/sandbox rules: excluded from formal story facts.
- The selected worldbook entries must not be labeled `canon-text` or `official-script`.

## Required Extraction Layers

Every later packet must require source-first extraction of:

1. `world_state`
2. `stage_characters`
3. all raw `-事件X` timeline events
4. raw event code, title, raw time, trigger, completion, orderIndex, and sourceRefs
5. every quoted dialogue line or source-backed skipped reason
6. characters, observed roles/status, and mentions
7. relationship signals and relationship candidates without co-occurrence promotion
8. appearance descriptions, outfit/equipment visuals, and visual traits when explicitly present
9. ability, Noble Phantasm, skill, magecraft, authority, transformation, summoning, and similar activation records when explicitly present
10. combat effects, visual effects, results, targets, costs, consequences, and state changes when explicitly present
11. `not-found-in-source` records for mandatory appearance / ability / combat-effect fields when the source lacks explicit detail
12. `sourceType`, `credibility`, and `canonStatus` on formal records

## Packet Contract

Each work packet must require:

- one file per raw timeline event;
- dialogue refs for every source quote or a source-backed skipped reason;
- per-character observed fragments or mentions;
- relationship signal/candidate extraction, with no co-occurrence promotion to formal graph;
- extracted appearance, ability/Noble Phantasm/skill, and combat-effect signal layers;
- explicit `not-found-in-source` records for missing mandatory visual / ability / combat detail;
- direct sourceRefs during prep and line-addressable sourceRefs after source text build;
- valid JSON outputs;
- no formal aggregate `characters.json`, `events.json`, or `relationships.json` as the fact store;
- no source import, old curated, prior pilot, docs, or skill modification.

## Agent Loop

Each later packet must run:

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

## Stage Gates

- Prep gate: prepared by this batch.
- Source text gate: closed in this batch; later stage must build and read line-addressable source text.
- Extraction gate: closed until source text exists and packet execution begins.
- Normalization gate: closed until packet final-status is passed.
- Merge gate: closed until normalized fragments pass audit.
- Timeline / graph gate: closed until canonical source layer exists and passes audit.
- Publication gate: closed; no old curated overwrite is authorized.

## Model and Tool Constraints

Required model for every later execution agent:

```text
lt-yuyu/gpt-5.5
```

If unavailable, execution is blocked and must not auto-downgrade.

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

Auditor agents are read-only. Later Generator / Fixer agents may use only controlled read/write/edit and structured JSON tools.

## Prep Completion Condition

This prep stage is complete only after the seven named scaffold artifacts and exactly two `work-packets/lostbelt/*.json` files for LB1 and LB2 are written under the pilot root. No extraction, normalization, merge, source text, graph, timeline, source import change, or old curated change is authorized.
