# Timeline Improvement Report — FSN/FZ Pilot

Date: 2026-07-12
Step id: `finalize-retry`

## Compared inputs

Old curated input inspected read-only:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/index.json`

Pilot inputs:

- `merged/merged-timeline.json`
- `waves/wave-009/output/event-index.json`
- `waves/wave-010/output/event-index.json`
- `waves/wave-011/output/event-index.json`
- `waves/wave-012/output/event-index.json`
- `waves/wave-015/output/timeline-skeleton.json`
- `waves/wave-016/output/event-time-review.json`
- `waves/wave-017/output/character-periods.json`
- `waves/wave-018/output/temporal-relationship-graph.json`

## Improvements

The pilot adds route-aware timeline structure that old curated does not expose as a strict final layer:

- Fate/Zero Fourth War timeline: order band 000-099.
- FSN Fate route: order band 200-299, epilogue 900-910.
- FSN UBW route: order band 300-399, epilogue 910.
- FSN HF route: order band 400-499, epilogue 920.
- Cross-route alignment records for common Saber summoning and route final confrontation stages.

## Query acceptance support

The final package supports the approved pilot query classes at the structural level:

- UBW mid-route Shirou knowledge can be answered through wave-017 character periods and UBW order band 300-399.
- HF late Sakura state changes can be answered through wave-011 events, wave-017 periods, and HF order band 400-499/920.
- FZ to FSN Kirei stance changes are represented through FZ events, Kirei relationships, and cross-period identity normalization.
- Saber FZ vs FSN summon state differences are represented with a recorded ID reconciliation risk requiring migration review.
- Relationship changes before/after route events are represented by timelineId and repaired timeRange fields on final graph edges.

## Date policy

- FZ exact timestamps are preserved only where the source provides them.
- FSN route timing remains relative-only.
- No FSN calendar dates were invented.

## Remaining risks

- Character period detail quality depends on partial source coverage.
- The compact merged timeline is a pilot surface, not yet a full replacement for all old curated Type-Moon chronology.

## Decision

The pilot timeline layer is a clear improvement for FSN/FZ route-aware retrieval and should be published side-by-side for evaluation.
