# wave-002 Fix Trail

## Generator Pass

Created canonical IDs for system anchors, core FSN/FZ timelines, recurring FSN characters, Servants, and initial factions.

## Audit Pass 1

Initial audit flagged:

- FZ class names could be misread as identified Heroic Spirits.
- Shirou/Archer relation needed explicit non-merge language.
- Sakura/Dark Sakura needed route variant separation.

## Fix Pass

- Moved under-supported FZ Servants into `candidateOnlyIds`.
- Added `doNotMergeWith` and `relatedForms` on Shirou/Archer and repeated class-name records.
- Added Sakura HF corrupted variant with same-entity relation and separate variant ID.

## Audit Rerun

Passed. Canonical ID manifest is source-backed and preserves continuity/version boundaries.
