# Plot Graph Noise Report — FSN/FZ Pilot vs Old Curated

Date: 2026-07-12
Step id: `finalize-retry`

## Compared inputs

Old curated input inspected read-only:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/plot-graph.json`

Pilot inputs:

- `merged/merged-timeline.json`
- `merged/merged-graph.json`
- wave event outputs summarized by group merges

## Findings

Old curated plot graph is organized across broad story lines, beginning with `fairy`/妖精国 material in the inspected readback. That is expected for the full Type-Moon archive, but it is noisy for an FSN/FZ-only retrieval target.

The pilot does not reuse the old broad plot graph as formal FSN/FZ structure. Instead, it builds compact timeline/event surfaces:

- `fz-fourth-war`: 8 events, order band 000-099.
- `fsn-fate-route`: 8 events, order band 200-299 plus epilogue range.
- `fsn-ubw-route`: 8 events, order band 300-399 plus epilogue range.
- `fsn-hf-route`: 8 events, order band 400-499 plus epilogue range.

## Noise reduced by pilot

- Non-FSN/FZ story lines are out of scope.
- Route branches are separated instead of flattened into a single plot surface.
- FSN route dates are relative-only; no calendar dates are invented.
- Formal graph edges are tied to route/FZ timeline bands.
- Concept/system/location nodes are typed distinctly and are not accepted as character nodes.

## Remaining pilot risks

- The pilot is not exhaustive for all old Fate/Type-Moon plot material because source transcription is partial.
- Compact merged timeline is suitable for pilot queries, not yet a full replacement for broad story browsing.

## Decision

The pilot substantially reduces plot graph noise for the FSN/FZ slice. Keep old curated for broad-world lookup and publish the pilot side-by-side for route-aware FSN/FZ retrieval.
