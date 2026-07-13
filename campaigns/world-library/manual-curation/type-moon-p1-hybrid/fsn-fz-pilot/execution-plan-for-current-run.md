# Execution Plan for Current Run — prep-source

Date: 2026-07-12
Step id: `prep-source`
Mutation scope: prep scaffold files only under `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/`
Required later subagent model: `lt-yuyu/gpt-5.5`

## Current run objective

Prepare the FSN/FZ pilot root scaffold and read-only preparation artifacts. Do not build source text. Do not create wave outputs. Do not start waves. Do not modify the existing curated archive.

## Inputs to read

1. Approved plan: `docs/type-moon-p1-hybrid-archive-plan.md`.
2. Approved skill: `.pi/skills/type-moon-p1-hybrid-archive/SKILL.md`.
3. Type-Moon import/curated README and notes.
4. Existing curated source registry.
5. Fate story index and four curated Fate story files.
6. Selected raw worldbook summaries/entries:
   - `Fate stay night.worldbook.json`
   - `FateStayNight - 沙盒's Lorebook.worldbook.json`
   - `fatezero.worldbook.json`
   - initial FSN/FZ/system-relevant slices of `型月 (1).worldbook.json`

## Files to write in this run

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/README.md
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/PLAN.locked.md
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/source-entry-selection.md
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/wave-manifest.draft.json
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/execution-plan-for-current-run.md
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/execution-log.md
```

No other files are in scope for this prep lane.

## Prep decisions

- The artifact requested by the user is `source-entry-selection.md`; the approved plan sometimes names a draft as `source-entry-selection.draft.md`. This run writes the requested filename and marks the content as draft/prep-gate status.
- The artifact requested by the user is `wave-manifest.draft.json`; no final `wave-manifest.json` is written.
- Empty future directories are not materialized with placeholder files because placeholder files are outside the requested artifact list. The pilot root directory is created through writing the approved files.
- Source text construction is deferred to a later confirmed Phase 0 run.

## Validation gates for this run

This run is complete when:

- All six prep artifacts exist under the pilot root.
- `wave-manifest.draft.json` is syntactically self-reviewed as JSON.
- `execution-log.md` records missing paths and ambiguities.
- No source text or wave output exists from this lane.
- No writes occur under `campaigns/world-library/worlds/type-moon-nasuverse/curated/`.

## Recommended next run after user confirmation

Recommended next confirmed run: **Phase 0 source text construction only**, not full waves.

Scope for next run:

1. Build line-addressable source text under `sources/worldbook-text/` and `sources/story-text/`.
2. Generate `sources/worldbook-text/manifest.json` / source manifest.
3. Filter `型月 (1).worldbook.json` to exact FSN/FZ/冬木/圣杯战争/御三家/system entries.
4. Run Source-Audit/Fix closed loop before any wave extraction.

Do not start wave-001 until source text passes source audit.
