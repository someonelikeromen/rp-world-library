# Task: WCA-155 - global final archive audit

**Created:** 2026-07-02
**Size:** M

## Review Level: 0 (None)

**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.
**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/WCA-155-global-final-archive-audit/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Produce the final all-world implementation audit after all world integrations complete, with separate columns for raw-text, chapter archives, volume archives, validation, retries, human-review queues, and core graph gaps.

## Dependencies

- **Task:** WCA-147
- **Task:** WCA-148
- **Task:** WCA-149
- **Task:** WCA-150
- **Task:** WCA-151
- **Task:** WCA-152
- **Task:** WCA-153
- **Task:** WCA-154

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

- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.*`
- `campaigns/world-library/manual-curation/STATUS.md`
- `campaigns/world-library/manual-curation/INDEX.md`

## Steps

### Step 0: Preflight

- [ ] Confirm all world integration tasks completed
- [ ] Collect validation reports and retry queues
- [ ] Collect failed/skipped items

**Artifacts:**
- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.json`

### Step 1: Final Chinese audit

- [ ] Build final Chinese report with separated source/derived/manual columns
- [ ] Validate generated JSON files
- [ ] Do not report missing manual graph layers as complete

**Artifacts:**
- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.json`
- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.md`

### Step 2: Documentation sync

- [ ] Update manual-curation STATUS and INDEX
- [ ] Record remaining human-review items and next actions

**Artifacts:**
- `campaigns/world-library/manual-curation/STATUS.md`
- `campaigns/world-library/manual-curation/INDEX.md`

## Documentation Requirements

**Must Update:**
- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.md`
- `campaigns/world-library/manual-curation/STATUS.md`
- `campaigns/world-library/manual-curation/INDEX.md`

**Check If Affected:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md`

## Completion Criteria

- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.
- [ ] Validation JSON exists and has no unhandled failures.
- [ ] Lessons file exists and records retry/quality learnings.
- [ ] Generated JSON parses successfully.
- [ ] No formal core graph file was overwritten.

## Git Commit Convention

If committing, every commit message must include `WCA-155`.

## Do NOT

- Do not crawl the network. Only read local files.
- Do not copy long source passages; write concise derived summaries.
- Do not overwrite `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, or `plot-graph.json`.
- Do not count raw-text files as chapter metadata.
- Do not promote relationship candidates to formal semantic edges.
- Do not silently skip blocked, too-short, image-only, or failed units.

---

## Amendments (Added During Execution)

