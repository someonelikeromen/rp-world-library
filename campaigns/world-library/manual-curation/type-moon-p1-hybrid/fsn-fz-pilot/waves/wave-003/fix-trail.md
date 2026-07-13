# wave-003 Fix Trail

## Generator Pass

Extracted Holy Grail War and worldline rules from Type-Moon filtered anchors, route summaries, and sandbox rule anchors.

## Audit Pass 1

Initial audit flagged that sandbox timing and mystery scaling could be mistaken for formal canon-like world law.

## Fix Pass

- Split `formalWorldRules` from `sandboxOrEngineRules`.
- Added rule classifications: `canon-like-world-rule`, `sandbox-rule`, and `rp-engine-rule`.
- Set `formalMergeAllowed: false` on sandbox-only and RP-engine records.
- Deferred locations and individual abilities to waves 007 and 008.

## Audit Rerun

Passed. The Holy Grail War base-rule layer is source-backed and keeps sandbox mechanics segregated.
