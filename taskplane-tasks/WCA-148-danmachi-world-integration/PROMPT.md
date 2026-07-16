# Task: WCA-148 - danmachi world integration

**Created:** 2026-07-02
**Size:** M

## Review Level: 0 (None)

**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.
**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/WCA-148-danmachi-world-integration/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Integrate completed chapter/unit archives for 在地下城寻求邂逅是否搞错了什么. Generate additive original/proposed layers, validation, runtime/search/timeline packs, and human-review queues without overwriting formal core graph files.

## Dependencies

- **Task:** WCA-030
- **Task:** WCA-031
- **Task:** WCA-032
- **Task:** WCA-033
- **Task:** WCA-034
- **Task:** WCA-035
- **Task:** WCA-036
- **Task:** WCA-037
- **Task:** WCA-038
- **Task:** WCA-039
- **Task:** WCA-040
- **Task:** WCA-041
- **Task:** WCA-042
- **Task:** WCA-043
- **Task:** WCA-044
- **Task:** WCA-045
- **Task:** WCA-046
- **Task:** WCA-047
- **Task:** WCA-048
- **Task:** WCA-049
- **Task:** WCA-050
- **Task:** WCA-051
- **Task:** WCA-052
- **Task:** WCA-053
- **Task:** WCA-054
- **Task:** WCA-055
- **Task:** WCA-056
- **Task:** WCA-057
- **Task:** WCA-058
- **Task:** WCA-059
- **Task:** WCA-060
- **Task:** WCA-061
- **Task:** WCA-062
- **Task:** WCA-063
- **Task:** WCA-064
- **Task:** WCA-065
- **Task:** WCA-066
- **Task:** WCA-067
- **Task:** WCA-068
- **Task:** WCA-069
- **Task:** WCA-070
- **Task:** WCA-071
- **Task:** WCA-072
- **Task:** WCA-073
- **Task:** WCA-074
- **Task:** WCA-075
- **Task:** WCA-076
- **Task:** WCA-077
- **Task:** WCA-078
- **Task:** WCA-079
- **Task:** WCA-080
- **Task:** WCA-081
- **Task:** WCA-082
- **Task:** WCA-083
- **Task:** WCA-084

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

- `campaigns/world-library/worlds/danmachi/curated/stories/chapter-archives*`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-refined`
- `campaigns/world-library/worlds/danmachi/curated/original-*.json`
- `campaigns/world-library/worlds/danmachi/curated/original-*.md`
- `campaigns/world-library/worlds/danmachi/curated/proposed-*.json`
- `campaigns/world-library/worlds/danmachi/curated/proposed-*.md`

## Steps

### Step 0: Preflight

- [ ] Locate all completed chapter/unit archive outputs for this world
- [ ] Record missing/failed volume or unit tasks
- [ ] Read existing core graph files only as reference

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/original-archive-validation.json`

### Step 1: Aggregate derived layers

- [ ] Build original chapter archive index and volume archive index
- [ ] Build derived entity index, relationship candidates, timeline, search index, and runtime pack
- [ ] Separate raw-text-derived and existing-curated-derived provenance

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/original-chapter-archive-index.json`
- `campaigns/world-library/worlds/danmachi/curated/original-volume-archive-index.json`
- `campaigns/world-library/worlds/danmachi/curated/original-entity-index.json`
- `campaigns/world-library/worlds/danmachi/curated/original-relationship-candidates.json`
- `campaigns/world-library/worlds/danmachi/curated/original-timeline.json`
- `campaigns/world-library/worlds/danmachi/curated/original-search-index.json`
- `campaigns/world-library/worlds/danmachi/curated/original-runtime-pack.json`

### Step 2: Validate and queue human review

- [ ] Validate coverage, JSON parse status, blocked/failed units, and long-verbatim risk
- [ ] Generate proposed core graph gap review instead of editing formal graphs
- [ ] Write world lessons

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/original-archive-validation.json`
- `campaigns/world-library/worlds/danmachi/curated/original-archive-lessons.md`
- `campaigns/world-library/worlds/danmachi/curated/proposed-core-graph-gap-review.json`
- `campaigns/world-library/worlds/danmachi/curated/proposed-core-graph-gap-review.md`

## Documentation Requirements

**Must Update:**
- `campaigns/world-library/worlds/danmachi/curated/original-archive-validation.json`
- `campaigns/world-library/worlds/danmachi/curated/original-archive-lessons.md`

**Check If Affected:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md`

## Completion Criteria

- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.
- [ ] Validation JSON exists and has no unhandled failures.
- [ ] Lessons file exists and records retry/quality learnings.
- [ ] Generated JSON parses successfully.
- [ ] No formal core graph file was overwritten.

## Git Commit Convention

If committing, every commit message must include `WCA-148`.

## Do NOT

- Do not crawl the network. Only read local files.
- Do not copy long source passages; write concise derived summaries.
- Do not overwrite `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, or `plot-graph.json`.
- Do not count raw-text files as chapter metadata.
- Do not promote relationship candidates to formal semantic edges.
- Do not silently skip blocked, too-short, image-only, or failed units.

---

## Amendments (Added During Execution)

