# Migration Recommendation — Type-Moon P1-Hybrid FSN/FZ Pilot

Date: 2026-07-12
Step id: `finalize-retry`
Terminal status: `passed-with-known-risks`

## Recommendation

`publish-curated-v2-pilot-side-by-side`

Do not replace `campaigns/world-library/worlds/type-moon-nasuverse/curated/` from this pilot.

## Rationale

The final FSN/FZ pilot package passed wave and final integration review after a finalize-retry repair to `merged/merged-graph.json`. It is structurally better than old curated for the approved FSN/FZ goals:

- p1-hybrid source policy is explicit.
- Formal and candidate layers remain separated.
- FSN/FZ route timelines are separated.
- Formal graph edges have source refs, audited status, confidence, `timelineId`, and `timeRange`.
- Character identity boundaries are explicit.
- Old broad-world plot/relationship noise is avoided for the pilot slice.

However, direct replacement is not appropriate because real source and migration risks remain:

- `SRC-001`: FSN core worldbook source text is only a partial anchor extract.
- `SRC-002`: FSN sandbox source text is partial and engine-heavy.
- `SRC-003`: Exact filtered count from `型月 (1).worldbook.json` is unresolved.
- `ID-RECON-001`: Saber Artoria FZ/FSN periodization requires review before replacement.
- `MIGRATION-001`: Old curated covers broad Type-Moon material outside the FSN/FZ pilot.

## What can be published now

A side-by-side pilot preview may be published or consumed from:

- `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/merged/`
- `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/audit/`
- `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/comparison/`

Suggested preview target, if the user later approves publication:

- `campaigns/world-library/worlds/type-moon-nasuverse/curated-v2-pilot/fsn-fz/`

No preview publication was performed by this retry.

## Required before replacement

Before any `replace-fate-slice-only` or broader migration decision, complete at least:

1. Expand FSN core worldbook source transcription beyond the three anchor entries.
2. Expand and classify the FSN sandbox lorebook rule corpus.
3. Complete the filtered pass over `型月 (1).worldbook.json` and record exact included/excluded counts.
4. Re-audit Saber FZ/FSN identity periodization against expanded source refs.
5. Re-run final merge/graph/timeline audit after expanded sources.
6. Obtain explicit user approval before touching old curated or publishing a curated-v2 preview.

## Final decision

The pilot is accepted for side-by-side review as `passed-with-known-risks`.

It is not accepted as a replacement package for old curated.
