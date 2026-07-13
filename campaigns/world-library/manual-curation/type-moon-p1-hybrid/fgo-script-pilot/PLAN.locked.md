# Locked Plan: FGO Part 1 Preparation Retry

## Scope

Prepare only the mandatory inventory, classification report, source-unit manifest, execution log, README, and nine `work-packets/part1/*.json` files for entries 80-88.

## Source

Primary source: `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json`.

Selected entries: 80 Fuyuki, 81 Orleans, 82 Septem, 83 Okeanos, 84 London, 85 America, 86 Camelot, 87 Babylonia, 88 Solomon.

Source facts remain source-backed only. Summary, character-profile, curated-story, engine, EJS, MVU, and sandbox material is classified separately and cannot overwrite script-primary facts.

## Packet contract

Each packet must require:

- one file per raw timeline event;
- one fragment file per observed character;
- one file per relationship edge or edge group;
- `sourceRefs` on every formal event, character fragment, and relationship file;
- raw event code, raw time, trigger, completion, and order preservation;
- `Generator -> Auditor -> Fixer -> Auditor rerun` until `final-status.status == passed`, `openIssues == 0`, `blockedIssues == 0`, and `canAdvance == true`.

## Irregular source rule

Orleans entry 81 contains two occurrences of raw code `事件N` and no `事件M`. Assign occurrence-qualified internal IDs such as `raw-事件N-occurrence-01` and `raw-事件N-occurrence-02`; retain `rawEventCode: 事件N` in both records. Do not rename either raw code to M or otherwise normalize the source silently.

## Model and tools

All later execution agents must explicitly use `lt-yuyu/gpt-5.5`. No automatic model downgrade is permitted. Subagents may use only controlled read/write/edit and structured JSON tools; no shell or executable commands.

## Gate

This preparation stage is complete only after all seven named artifacts and exactly nine Part 1 packet JSON files are read back and validated. No source extraction may begin in this retry.
