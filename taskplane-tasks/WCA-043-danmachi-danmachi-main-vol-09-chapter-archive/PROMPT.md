# Task: WCA-043 - danmachi danmachi-main vol-09 chapter archive

**Created:** 2026-07-02
**Size:** M

## Review Level: 0 (None)

**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.
**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/WCA-043-danmachi-danmachi-main-vol-09-chapter-archive/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Read every .txt chapter in `campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-09` fully and in filename order. After each chapter, immediately write chapter archive JSON/MD. Then validate and refine 在地下城寻求邂逅是否搞错了什么 / danmachi-main / vol-09. Detected source files: 10.

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

- `campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-09`
- `campaigns/world-library/worlds/danmachi/curated/stories/chapter-archives/danmachi-main/vol-09`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-refined/danmachi-main`
- `campaigns/world-library/worlds/danmachi/curated/stories/retry-queues/danmachi-main`

## Steps

### Step 0: Preflight

- [ ] Verify source dir exists: campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-09
- [ ] List all .txt files in stable order
- [ ] Create archive, validation, refined, and retry directories

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/stories/chapter-archives/danmachi-main/vol-09`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-refined/danmachi-main`
- `campaigns/world-library/worlds/danmachi/curated/stories/retry-queues/danmachi-main`

### Step 1: Read chapters and write immediate archives

- [ ] Read each .txt fully, using offset reads for large files
- [ ] Write one rp-chapter-archive-v1 JSON and one Markdown file per chapter immediately after reading
- [ ] Capture summary, events, characters, locations, terms, items, factions, relationshipSignals, timelineSignals, continuityNotes, uncertainties, and qualityFlags
- [ ] Avoid long verbatim excerpts

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/stories/chapter-archives/danmachi-main/vol-09/*.json`
- `campaigns/world-library/worlds/danmachi/curated/stories/chapter-archives/danmachi-main/vol-09/*.md`

### Step 2: Validate volume and retry failures

- [ ] Compare archive coverage against source files and _manifest.json when present
- [ ] Explain exceptions for afterword/setting/blocked/too-short/image-only chapters
- [ ] Retry failed or empty units within policy limits, otherwise write retry queue entries
- [ ] Confirm generated JSON parses

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main/vol-09.validation.json`
- `campaigns/world-library/worlds/danmachi/curated/stories/retry-queues/danmachi-main/vol-09.retry.json`

### Step 3: Refine volume and record lessons

- [ ] Write volume summary, event chain, entity increments, relationship candidates, timeline increments, and search keywords
- [ ] Write lessons covering name conventions, relationship signals, special structures, and retry learnings
- [ ] Confirm no core graph files changed

**Artifacts:**
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main/vol-09.json`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main/vol-09.md`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main/vol-09.lessons.md`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-refined/danmachi-main/vol-09.json`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-refined/danmachi-main/vol-09.md`

## Documentation Requirements

**Must Update:**
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main/vol-09.validation.json`
- `campaigns/world-library/worlds/danmachi/curated/stories/volume-archives/danmachi-main/vol-09.lessons.md`

**Check If Affected:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md`

## Completion Criteria

- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.
- [ ] Validation JSON exists and has no unhandled failures.
- [ ] Lessons file exists and records retry/quality learnings.
- [ ] Generated JSON parses successfully.
- [ ] No formal core graph file was overwritten.

## Git Commit Convention

If committing, every commit message must include `WCA-043`.

## Do NOT

- Do not crawl the network. Only read local files.
- Do not copy long source passages; write concise derived summaries.
- Do not overwrite `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, or `plot-graph.json`.
- Do not count raw-text files as chapter metadata.
- Do not promote relationship candidates to formal semantic edges.
- Do not silently skip blocked, too-short, image-only, or failed units.

---

## Amendments (Added During Execution)

