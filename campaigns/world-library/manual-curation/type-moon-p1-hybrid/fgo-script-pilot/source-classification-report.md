# Source Classification Report

Status: prep complete; no source extraction performed.

## Primary selection

Entries 80-88 in `[沙盒]FGO 0.8.worldbook.json` are classified as `script-like` and selected as the Part 1 script-primary source pool. Their embedded `world_state`, `stage_characters`, and `world_timeline` sections are preserved as distinct source regions during the later line-addressable source-text stage.

Classification metadata for formal facts: `sourceType: user-file-worldbook-script`, `canonStatus: canon-like` (adapted where appropriate), `credibility: B`. These entries are not official script text and must not be labeled `canon-text` or `official-script`.

## Entry selection

| Entry | Chapter | Estimated events | Estimated quotes | Classification |
|---:|---|---:|---:|---|
| 80 | Fuyuki | 11 | 22 | script-like / primary |
| 81 | Orleans | 16 | 38 | script-like / primary; duplicate-code anomaly |
| 82 | Septem | 16 | 33 | script-like / primary |
| 83 | Okeanos | 14 | 29 | script-like / primary |
| 84 | London | 14 | 29 | script-like / primary |
| 85 | America | 23 | 34 | script-like / primary |
| 86 | Camelot | 33 | 65 | script-like / primary |
| 87 | Babylonia | 23 | 36 | script-like / primary |
| 88 | Solomon | 23 | 25 | script-like / primary |

## Irregularity policy

Orleans entry 81 contains duplicate raw event code `事件N` and no raw `事件M`. This is source data, not a correction target. Later workers must identify the two records by occurrence order, for example `raw-事件N-occurrence-01` and `raw-事件N-occurrence-02`, while retaining `rawEventCode: 事件N` in each event file. No silent renumbering, inferred `事件M`, or replacement of raw labels is allowed.

## Non-primary pools

- `型月 (1).worldbook.json`: `story-summary`; cross-check only, never the event-primary source.
- `奇妙的世界书DLC_型月篇2026_0126.worldbook.json`: `character-profile`; supplement only, with continuity and fan/RP contamination risk.
- Existing curated FGO story mirrors: derived comparison material, not an authority that overwrites the selected script-like entry.
- Engine, EJS, MVU, sandbox, and agent-inference material: excluded from formal plot facts. Stage-character system instructions must remain instruction metadata, not canon facts.

## Required downstream controls

Every formal event, per-character fragment, and per-edge relationship file must include `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`. Uncertain material is candidate-only. Each packet must pass the full Generator -> Auditor -> Fixer -> Auditor rerun loop before normalization or derived indexes.
