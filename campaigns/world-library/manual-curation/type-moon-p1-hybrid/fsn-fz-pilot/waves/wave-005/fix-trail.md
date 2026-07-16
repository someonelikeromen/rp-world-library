# wave-005 Fix Trail

## Generator Pass

Built formal FSN Servant records and candidate FZ class records from wave-002 canonical IDs, FSN core anchors, Fate/Zero timeline, and route summaries.

## Audit Pass 1

Initial audit flagged:

- Repeated class names could create accidental merges.
- FZ class-only timeline lines were insufficient for true-name formalization.
- Gilgamesh required explicit do-not-merge with Archer/EMIYA.

## Fix Pass

- Added `doNotMergeWith` boundaries for repeated class names.
- Kept under-supported FZ Servants as `candidateServants`.
- Preserved Gilgamesh as distinct from Archer/EMIYA despite Archer-class aliasing.

## Audit Rerun

Passed. Servant records preserve identity, class, route variant, and source-support boundaries.
