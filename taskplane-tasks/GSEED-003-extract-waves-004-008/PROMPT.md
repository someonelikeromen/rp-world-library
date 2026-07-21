# Task: GSEED-003 - Gundam SEED Waves 004-008 Extraction

**Created:** 2026-07-19
**Size:** XL

## Review Level: 2 (Plan + Code)

**Assessment:** Multi-wave extraction, packet audits, and extended coverage reporting across characters, world rules, battles, and controversy/novel materials.
**Score:** 5/8 — Blast radius: 2, Pattern novelty: 1, Security: 0, Reversibility: 2

## Mission

Extract and audit Gundam SEED opus waves 004-008 after source ingest completes. Produce packet-level formal outputs, minimum-gate validation, extended coverage reports, and extended gap indexes. Keep concurrency at 2 or below and use the 5-minute retry policy for transient source or file failures.

If the execution harness is operating in bash-free/read-write-docs-only mode, do not claim extraction, JSON validation, or audit generation. Record command-dependent or unavailable steps as blockers in task outputs instead.

## Dependencies

- **Task:** GSEED-001

## Context to Read First

- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/PLAN.locked.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/archive-structure-constraints.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/extended-coverage-policy.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/merge-policy.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/source-classification-report.md`

## File Scope

- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/waves/wave-004/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/waves/wave-005/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/waves/wave-006/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/waves/wave-007/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/waves/wave-008/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/packet-audits/wave-004/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/packet-audits/wave-005/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/packet-audits/wave-006/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/packet-audits/wave-007/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/packet-audits/wave-008/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/extended-coverage/wave-004/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/extended-coverage/wave-005/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/extended-coverage/wave-006/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/extended-coverage/wave-007/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/audit/extended-coverage/wave-008/**`

## Steps

### Step 0: Preflight

- [ ] Read the refreshed source inventory and wave packet contracts.
- [ ] Confirm packet scopes and expected counts.
- [ ] Create any missing output directories.

### Step 1: Waves 004-005

- [ ] Extract character fragments and relationship edges.
- [ ] Cover appearance, attire, personality, background, experience, relationships, abilities or skills, and voice when source-backed.

### Step 2: Waves 006-008

- [ ] Extract world-rules, battles, controversy, and novel-related materials.
- [ ] Separate source-backed fact from analysis or controversy.
- [ ] Produce packet-level generation, audit, fix, rerun, final-status, extended coverage, and gap index artifacts.

### Step 3: Validate

- [ ] Validate JSON files.
- [ ] Confirm `minimumGate` passed for any packet marked passed.
- [ ] Record unresolved extended gaps explicitly.

## Completion Criteria

- [ ] All packet outputs exist for waves 004-008.
- [ ] All packet final-status files are written.
- [ ] All packet extended coverage reports and gap indexes are written.
- [ ] JSON parses successfully.

## Do NOT

- Do not write final merged graph outputs.
- Do not merge unrelated entities into one file.
- Do not invent facts missing from the source layer.
