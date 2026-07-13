# Type-Moon P1-Hybrid Archive — FSN/FZ Pilot

Status: preparation scaffold only

Current run: `prep-source`
Prepared on: 2026-07-12
Required execution model for later agent lanes: `lt-yuyu/gpt-5.5`

## Purpose

This pilot validates the approved Type-Moon P1-Hybrid Archive approach on the Fate/stay night + Fate/Zero slice without modifying the existing curated archive.

The pilot is explicitly **p1-hybrid**, not canon source-backed p1-scan. Current sources are user/imported worldbook JSON files and curated story summaries, not official novel/game script source text.

## Authority and locked references

Authoritative inputs for this scaffold:

- `docs/type-moon-p1-hybrid-archive-plan.md`
- `.pi/skills/type-moon-p1-hybrid-archive/SKILL.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/source-registry.json`
- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/README.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/README.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/curation-notes.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/index.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/*.md`
- selected raw worldbooks under `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/`

## Hard boundaries

- Do not modify `campaigns/world-library/worlds/type-moon-nasuverse/curated/`.
- Do not publish or migrate to `curated-v2` without explicit user confirmation.
- Do not call bash/shell/python/node/deno/powershell/cmd in subagents.
- Every future subagent step must explicitly set `agent.model` to `lt-yuyu/gpt-5.5`.
- If `lt-yuyu/gpt-5.5` is unavailable, do not auto-downgrade; return `blocked`.
- Later waves must use Generator → Auditor → Fixer → Auditor rerun until `passed`.
- Candidate and formal outputs must stay separated.
- Formal facts must have source refs, source type, credibility, and canon status.

## Prep artifacts in this directory

- `PLAN.locked.md` — locked local summary/copy of approved plan constraints.
- `source-entry-selection.md` — selected source pools and known ambiguities.
- `wave-manifest.draft.json` — draft wave plan and source pool estimates.
- `execution-plan-for-current-run.md` — this run's prep-only execution plan and next gate.
- `execution-log.md` — read/write log, missing paths, ambiguity notes, validation status.

## What was intentionally not created

This run did **not** create source text under `sources/`, did **not** create wave outputs, and did **not** start waves. Empty future directories are planned by the approved plan, but this tool lane only wrote the approved prep artifacts and their parent directory.

## Planned final pilot layers after future confirmation

```text
sources/
waves/
intermediate/
group-merged/
merged/
candidates/
audit/
comparison/
```

The approved full structure is locked in `PLAN.locked.md`; it remains future work after confirmation of the prep artifacts.
