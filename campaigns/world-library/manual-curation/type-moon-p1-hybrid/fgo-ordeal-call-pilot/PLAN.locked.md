# Locked Plan: FGO Ordeal Call I-III Prep Gate

Date: 2026-07-13
Step id: `prep-ordeal-call`
Required model: `lt-yuyu/gpt-5.5`

## Objective

Create the isolated prep gate workspace for Type-Moon FGO script p1 Ordeal Call I-III using entries 104, 105, and 106 from `[沙盒]FGO 0.8.worldbook.json`.

This plan authorizes prep artifacts only. It explicitly does not authorize source-text creation, extraction, normalization, merge, graph, timeline, final audit, or publish work.

## Locked Outputs

Create exactly these prep artifacts:

- `README.md`
- `PLAN.locked.md`
- `STATUS.md`
- `execution-log.md`
- `source-inventory.json`
- `source-classification-report.md`
- `source-unit-manifest.json`
- `work-packets/ordeal-call/oc1-paper-moon.json`
- `work-packets/ordeal-call/oc2-id.json`
- `work-packets/ordeal-call/oc3-integration.json`

No `sources/`, `extracted/`, `normalized/`, `merged/`, `graph/`, `timeline/`, `audit/`, or `worldbook-script/` outputs are authorized in this prep step.

## Source Selection

The selected script-primary source units are:

| entryIndex | comment | titleRaw | packet slug |
|---:|---|---|---|
| 104 | `FGO_奏章I_纸月` | `FGO_奏章I_虚数罗针内界_纸月` | `oc1-paper-moon` |
| 105 | `FGO_奏章II_伊德` | `FGO_奏章II_不可逆废弃孔_伊德` | `oc2-id` |
| 106 | `FGO_奏章III_统合` | `FGO_奏章III_新灵长后继战_Archetype_Inception` | `oc3-integration` |

Classification for all selected units:

```text
sourceType: user-file-worldbook-script
classification: script-like
canonStatus: canon-like
credibility: B
formalEventSource: true
```

These source units are not official canon text and must not be labeled `canon-text` or `official-script`.

## Downstream Gate Requirements

Before extraction, later workers must create line-addressable source text for each selected entry. Until then:

```text
sourceTextStatus: not-created-in-prep
sourceTextRequiredBeforeExtraction: true
extractionGate: closed-until-source-text-built
```

Downstream extraction must include:

- world / chapter state and setting facts
- all source-backed phase and event units
- all source-backed character mentions and role/status claims
- relationship signals and relationship candidates with temporal scoping
- appearance descriptions
- outfit and equipment visuals
- Noble Phantasm, skill, magecraft, authority, transformation, summoning, and other activation records
- combat effects, targets, costs, consequences, and visual effects
- explicit `not-found-in-source` records for mandatory visual / ability / combat fields absent from the source
- source-first raw terminology and candidate-only unsupported labels

Formal downstream storage rules:

- Per-event formal files are required for events.
- Per-edge formal files are required for relationships.
- Do not create formal aggregate fact stores named `characters.json`, `events.json`, or `relationships.json`.
- Every formal downstream record must carry `sourceRefs`, `sourceType`, `credibility`, and `canonStatus` where applicable.

## Forbidden Work In This Step

- Do not modify source imports.
- Do not modify old curated files, docs, skills, or previous pilots.
- Do not create source text.
- Do not extract facts.
- Do not run merge, graph, timeline, final audit, or publish stages.
- Do not use bash, shell, Python, Node, Deno, PowerShell, cmd, or executable scripts.
