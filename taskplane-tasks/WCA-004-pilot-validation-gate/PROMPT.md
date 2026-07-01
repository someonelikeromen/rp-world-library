# Task: WCA-004 - pilot validation gate

**Created:** 2026-07-02
**Size:** S

## Review Level: 0 (None)

**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.
**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/WCA-004-pilot-validation-gate/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Validate the three pilot volume archives before opening the full batch. If anything fails, write exact retry instructions and do not hide failures.

## Dependencies

- **Task:** WCA-001
- **Task:** WCA-002
- **Task:** WCA-003

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

- `campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.*`
- `campaigns/world-library/worlds/*/curated/stories/chapter-archives/*/vol-01/*`

## Steps

### Step 0: Preflight

- [ ] Locate all three pilot output directories
- [ ] Confirm each pilot source directory has outputs

**Artifacts:**
- `campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.json`

### Step 1: Pilot validation

- [ ] Check archive coverage and JSON parse status
- [ ] Check validation and lessons files exist
- [ ] List failures with exact retry paths

**Artifacts:**
- `campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.json`
- `campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.md`

## Documentation Requirements

**Must Update:**
- `campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.md`

**Check If Affected:**
- `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md`

## Completion Criteria

- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.
- [ ] Validation JSON exists and has no unhandled failures.
- [ ] Lessons file exists and records retry/quality learnings.
- [ ] Generated JSON parses successfully.
- [ ] No formal core graph file was overwritten.

## Git Commit Convention

If committing, every commit message must include `WCA-004`.

## Do NOT

- Do not crawl the network. Only read local files.
- Do not copy long source passages; write concise derived summaries.
- Do not overwrite `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, or `plot-graph.json`.
- Do not count raw-text files as chapter metadata.
- Do not promote relationship candidates to formal semantic edges.
- Do not silently skip blocked, too-short, image-only, or failed units.

---

## Amendments (Added During Execution)

