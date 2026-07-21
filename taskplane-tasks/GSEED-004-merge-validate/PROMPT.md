# Task: GSEED-004 - Gundam SEED Merge and Validation

**Created:** 2026-07-19
**Size:** L

## Review Level: 2 (Plan + Code)

**Assessment:** Merge validated packet outputs into wave, group, merged, and graph layers; generate final audit and migration recommendation artifacts.
**Score:** 5/8 — Blast radius: 2, Pattern novelty: 1, Security: 0, Reversibility: 2

## Mission

Merge all validated Gundam SEED packet outputs, build the final candidate merged layer, derive graph outputs from merged only, and write final audit and migration recommendation reports. Keep concurrency at 2 or below and use the 5-minute retry policy for transient file or verification failures.

If the execution harness is operating in bash-free/read-write-docs-only mode, do not claim merge, graph derivation, JSON validation, or final audit generation. Record missing packet outputs and command-dependent checks as blockers instead.

## Dependencies

- **Task:** GSEED-002
- **Task:** GSEED-003

## Context to Read First

- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/PLAN.locked.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/archive-structure-constraints.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/extended-coverage-policy.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/merge-policy.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/execution-plan.json`

## File Scope

- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/intermediate/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/group-merged/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/merged/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/graph/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/comparison/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/candidates/**`

## Steps

### Step 0: Preflight

- [ ] Confirm all packet final-status files are present and passed or explicitly blocked.
- [ ] Confirm extended coverage reports and gap indexes exist.
- [ ] Read wave packet outputs only from validated packet layers.

### Step 1: Wave and Group Merge

- [ ] Merge each passed packet into its wave-merged directory.
- [ ] Merge waves into the topic groups described by the merge policy.
- [ ] Preserve provenance, aliases, and conflict records.

### Step 2: Final Merge and Graph

- [ ] Produce the final candidate `merged/` layer.
- [ ] Build graph outputs from `merged/` only.
- [ ] Do not back-propagate graph decisions into fact sources.

### Step 3: Final Audit

- [ ] Write final merge report.
- [ ] Write final extended coverage summary.
- [ ] Write migration recommendation and any unresolved gap notes.

## Completion Criteria

- [ ] Wave merge reports exist.
- [ ] Group merge reports exist.
- [ ] Final merge report exists.
- [ ] Graph outputs are derived from merged only.
- [ ] Final extended coverage summary exists.
- [ ] JSON parses successfully.

## Do NOT

- Do not write to the formal world library.
- Do not invent facts to resolve merge conflicts.
- Do not treat graph outputs as a source of truth.
