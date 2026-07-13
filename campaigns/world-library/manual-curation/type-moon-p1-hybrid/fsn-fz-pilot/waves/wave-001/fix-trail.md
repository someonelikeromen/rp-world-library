# wave-001 Fix Trail

## Generator Pass

Created the source inventory and dedupe scan from the source manifest and source text files.

## Audit Pass 1

Initial audit noted two risks:

- The inventory could be misread as full raw-worldbook coverage.
- The delegated task mentioned locations and abilities, but the locked wave plan assigns those categories to waves 007 and 008.

## Fix Pass

- Added explicit `captureStatus` values and coverage notes.
- Added a deferral note for locations and abilities.
- Marked all source-layer partial coverage as residual risk, not a blocker.

## Audit Rerun

Passed. The wave satisfies the wave-001 scope for the current source layer and preserves the p1-hybrid limitations.
