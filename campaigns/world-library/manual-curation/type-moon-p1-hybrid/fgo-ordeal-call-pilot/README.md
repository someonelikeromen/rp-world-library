# FGO Ordeal Call I-III Prep Gate

Date: 2026-07-13
Step id: `prep-ordeal-call`
Model requirement: `lt-yuyu/gpt-5.5`

This isolated workspace prepares the Type-Moon FGO script p1 Ordeal Call I-III units for later source-text creation and extraction. It does not create source text, extracted facts, normalized facts, merged graph data, timelines, final audit output, or publication artifacts.

## Scope

Allowed mutation scope:

`campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-ordeal-call-pilot/`

Primary source inspected:

`campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json`

Selected entries:

| entryIndex | comment | packet slug | direct sourceRef | status |
|---:|---|---|---|---|
| 104 | `FGO_奏章I_纸月` | `oc1-paper-moon` | `[沙盒]FGO 0.8.worldbook.json:13427-13428` | present |
| 105 | `FGO_奏章II_伊德` | `oc2-id` | `[沙盒]FGO 0.8.worldbook.json:13550-13551` | present |
| 106 | `FGO_奏章III_统合` | `oc3-integration` | `[沙盒]FGO 0.8.worldbook.json:13673-13674` | present |

## Gate Status

Prep gate: `ready`

Source text gate: `closed-not-built-in-prep`

Extraction gate: `closed-extraction-not-started`

No expected entry was missing or ambiguous during prep inspection. No source-text files were created.

## Downstream Rules

Later workers must build line-addressable source text before extraction. Every formal record must carry `sourceRefs`, `sourceType`, `credibility`, and `canonStatus` where applicable.

Required downstream coverage includes appearance, outfit and equipment visuals, Noble Phantasm / skill / magecraft / authority activation, combat effects, and explicit `not-found-in-source` records when the source does not provide mandatory visual or ability details.

Use source-first terminology. Unsupported labels, normalized IDs, relationship types, and derived classifications are candidate-only until supported by the current source.

Do not create formal aggregate fact stores named `characters.json`, `events.json`, or `relationships.json`. Later formal records must be split into per-entity, per-event, or per-edge files, with indexes serving only as indexes.
