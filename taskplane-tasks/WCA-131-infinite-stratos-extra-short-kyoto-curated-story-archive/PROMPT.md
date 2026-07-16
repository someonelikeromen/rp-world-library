# Task: WCA-131 - infinite-stratos extra-short-kyoto curated story archive

**Created:** 2026-07-02
**Size:** M

## Review Level: 0 (None)

**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.
**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/WCA-131-infinite-stratos-extra-short-kyoto-curated-story-archive/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Read every Markdown story source in `campaigns/world-library/worlds/infinite-stratos/curated/stories/extra-short-kyoto` fully. After each file, immediately write curated-derived archive JSON/MD. Then validate and refine IS〈Infinite Stratos〉 / extra-short-kyoto. Detected source files: 6.

## Dependencies

- **Task:** WCA-004

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md` — workflow, schemas, retry policy, and layer definitions.
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.json` — machine-readable implementation policy.

## Environment

- **Workspace:** `E:/pi-st`
- **Services required:** None

## File Scope

- `campaigns/world-library/worlds/infinite-stratos/curated/stories/extra-short-kyoto`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/chapter-archives-curated/extra-short-kyoto`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/retry-queues-curated/extra-short-kyoto`

## Steps

### Step 0: Preflight

- [ ] Verify source dir exists: campaigns/world-library/worlds/infinite-stratos/curated/stories/extra-short-kyoto
- [ ] List all Markdown source files in stable order
- [ ] Create curated-derived archive, validation, and retry directories

**Artifacts:**
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/chapter-archives-curated/extra-short-kyoto`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/retry-queues-curated/extra-short-kyoto`

### Step 1: Read source files and write immediate archives

- [ ] Read each Markdown file fully, using offset reads for large files
- [ ] Write one rp-chapter-archive-v1-compatible JSON and one Markdown file per source with sourceLayer=existing-curated-derived
- [ ] Extract events, characters, locations, terms, relationshipSignals, timelineSignals, continuityNotes, and uncertainties
- [ ] Do not claim raw-text provenance

**Artifacts:**
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/chapter-archives-curated/extra-short-kyoto/*.json`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/chapter-archives-curated/extra-short-kyoto/*.md`

### Step 2: Validate unit and retry failures

- [ ] Compare archive coverage against Markdown source list
- [ ] Explain exceptions for non-story notes or settings files
- [ ] Retry failed or empty units within policy limits, otherwise write retry queue entries
- [ ] Confirm generated JSON parses

**Artifacts:**
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives/extra-short-kyoto.validation.json`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/retry-queues-curated/extra-short-kyoto/extra-short-kyoto.retry.json`

### Step 3: Refine unit and record lessons

- [ ] Write unit summary, event chain, entity increments, relationship candidates, timeline increments, and search keywords
- [ ] Write lessons covering name conventions, source limitations, and retry learnings
- [ ] Confirm no core graph files changed

**Artifacts:**
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives/extra-short-kyoto.json`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives/extra-short-kyoto.md`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives/extra-short-kyoto.lessons.md`

## Documentation Requirements

**Must Update:**
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives/extra-short-kyoto.validation.json`
- `campaigns/world-library/worlds/infinite-stratos/curated/stories/curated-unit-archives/extra-short-kyoto.lessons.md`

**Check If Affected:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md`

## Completion Criteria

- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.
- [ ] Validation JSON exists and has no unhandled failures.
- [ ] Lessons file exists and records retry/quality learnings.
- [ ] Generated JSON parses successfully.
- [ ] No formal core graph file was overwritten.

## Git Commit Convention

If committing, every commit message must include `WCA-131`.

## Do NOT

- Do not crawl the network. Only read local files.
- Do not copy long source passages; write concise derived summaries.
- Do not overwrite `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, or `plot-graph.json`.
- Do not count raw-text files as chapter metadata.
- Do not promote relationship candidates to formal semantic edges.
- Do not silently skip blocked, too-short, image-only, or failed units.

---

## Amendments (Added During Execution)

