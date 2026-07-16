# Task: WCA-152 - rakudai-kishi world integration

**Created:** 2026-07-02
**Size:** M

## Review Level: 0 (None)

**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.
**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/WCA-152-rakudai-kishi-world-integration/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Integrate completed chapter/unit archives for 落第骑士英雄谭. Generate additive original/proposed layers, validation, runtime/search/timeline packs, and human-review queues without overwriting formal core graph files.

## Dependencies

- **Task:** WCA-002
- **Task:** WCA-089
- **Task:** WCA-090
- **Task:** WCA-091
- **Task:** WCA-092
- **Task:** WCA-093
- **Task:** WCA-094
- **Task:** WCA-095
- **Task:** WCA-096
- **Task:** WCA-097
- **Task:** WCA-098
- **Task:** WCA-099
- **Task:** WCA-100
- **Task:** WCA-101
- **Task:** WCA-102
- **Task:** WCA-103
- **Task:** WCA-104
- **Task:** WCA-105
- **Task:** WCA-106
- **Task:** WCA-107
- **Task:** WCA-108

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

- `campaigns/world-library/worlds/rakudai-kishi/curated/stories/chapter-archives*`
- `campaigns/world-library/worlds/rakudai-kishi/curated/stories/volume-archives`
- `campaigns/world-library/worlds/rakudai-kishi/curated/stories/volume-refined`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-*.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-*.md`
- `campaigns/world-library/worlds/rakudai-kishi/curated/proposed-*.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/proposed-*.md`

## Steps

### Step 0: Preflight

- [ ] Locate all completed chapter/unit archive outputs for this world
- [ ] Record missing/failed volume or unit tasks
- [ ] Read existing core graph files only as reference

**Artifacts:**
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-archive-validation.json`

### Step 1: Aggregate derived layers

- [ ] Build original chapter archive index and volume archive index
- [ ] Build derived entity index, relationship candidates, timeline, search index, and runtime pack
- [ ] Separate raw-text-derived and existing-curated-derived provenance

**Artifacts:**
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-chapter-archive-index.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-volume-archive-index.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-entity-index.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-relationship-candidates.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-timeline.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-search-index.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-runtime-pack.json`

### Step 2: Validate and queue human review

- [ ] Validate coverage, JSON parse status, blocked/failed units, and long-verbatim risk
- [ ] Generate proposed core graph gap review instead of editing formal graphs
- [ ] Write world lessons

**Artifacts:**
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-archive-validation.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-archive-lessons.md`
- `campaigns/world-library/worlds/rakudai-kishi/curated/proposed-core-graph-gap-review.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/proposed-core-graph-gap-review.md`

## Documentation Requirements

**Must Update:**
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-archive-validation.json`
- `campaigns/world-library/worlds/rakudai-kishi/curated/original-archive-lessons.md`

**Check If Affected:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md`

## Completion Criteria

- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.
- [ ] Validation JSON exists and has no unhandled failures.
- [ ] Lessons file exists and records retry/quality learnings.
- [ ] Generated JSON parses successfully.
- [ ] No formal core graph file was overwritten.

## Git Commit Convention

If committing, every commit message must include `WCA-152`.

## Do NOT

- Do not crawl the network. Only read local files.
- Do not copy long source passages; write concise derived summaries.
- Do not overwrite `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, or `plot-graph.json`.
- Do not count raw-text files as chapter metadata.
- Do not promote relationship candidates to formal semantic edges.
- Do not silently skip blocked, too-short, image-only, or failed units.

---

## Amendments (Added During Execution)

