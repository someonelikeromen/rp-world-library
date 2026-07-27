# Task: TPR-001 - Validate P0 Bootstrap

**Created:** 2026-07-27
**Size:** S

## Review Level: 1 (Plan Only)

**Assessment:** Documentation/config validation only, but it establishes the runtime task area baseline.
**Score:** 2/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/two-pass-runtime/TPR-001-validate-p0-bootstrap/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Validate that P0 bootstrap files exist, are internally consistent, and define a usable independent Two-Pass Runtime task area without colliding with the existing WCA world archive task area.

## Dependencies

- **None**

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`

**Tier 3 (load only if needed):**
- `AGENTS.md` — global project rules and Windows environment constraints.
- `docs/rp-two-pass-runtime-system-plan.md` — target runtime architecture.
- `docs/rp-two-pass-runtime-iteration-plan.md` — long-term iteration mechanism.
- `docs/rp-two-pass-runtime-roadmap.md` — phase status and initial task batch.
- `docs/rp-two-pass-runtime-acceptance.md` — P0 acceptance criteria.
- `docs/rp-two-pass-runtime-adr.md` — accepted architecture decisions.
- `.pi/taskplane-config.json` — task area registration.

## Environment

- **Workspace:** `E:/pi-st`
- **Services required:** None

## File Scope

- `docs/rp-two-pass-runtime-roadmap.md`
- `docs/rp-two-pass-runtime-acceptance.md`
- `docs/rp-two-pass-runtime-adr.md`
- `.pi/taskplane-config.json`
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`
- `taskplane-tasks/two-pass-runtime/TPR-001-validate-p0-bootstrap/*`

## Steps

### Step 0: Preflight

- [ ] Required files and paths exist
- [ ] Dependencies satisfied

### Step 1: Validate P0 bootstrap consistency

- [ ] Confirm taskplane config has `two-pass-runtime` area with `TPR` prefix
- [ ] Confirm roadmap, acceptance, ADR, system plan, and iteration plan cross-reference each other correctly
- [ ] Confirm `CONTEXT.md` next task ID and initial task list are consistent
- [ ] Confirm no file scope points at `E:/pi-rp` or RP story memory

### Step 2: Documentation fixes if needed

- [ ] Apply only minimal corrections needed for consistency
- [ ] Do not expand runtime design scope
- [ ] Log any follow-up work in `CONTEXT.md` Technical Debt / Future Work

### Step 3: Testing & Verification

- [ ] Verify referenced files exist using project tools or Windows-compatible commands
- [ ] Confirm JSON config remains valid
- [ ] Confirm no orchestrator batch was started by this task

### Step 4: Documentation & Delivery

- [ ] Must Update docs modified if inconsistencies were found
- [ ] Discoveries logged in STATUS.md

## Documentation Requirements

**Must Update:**
- `docs/rp-two-pass-runtime-roadmap.md` — only if status or task list is inconsistent.
- `docs/rp-two-pass-runtime-acceptance.md` — only if P0 criteria are incomplete.
- `taskplane-tasks/two-pass-runtime/CONTEXT.md` — only if task area metadata is inconsistent.

**Check If Affected:**
- `AGENTS.md` — do not modify unless a contradiction blocks P0 validation.

## Completion Criteria

- [ ] P0 bootstrap files are present and internally consistent
- [ ] Taskplane config includes independent TPR area
- [ ] No runtime code implementation performed
- [ ] STATUS.md records validation outcome

## Git Commit Convention

Commits happen at step boundaries. All commits for this task MUST include the task ID:

- `docs(TPR-001): validate P0 bootstrap`

## Do NOT

- Start orch automatically
- Modify `E:/pi-rp`
- Modify RP story memory or character cards
- Implement runtime extension code
- Expand task scope beyond P0 validation

---

## Amendments (Added During Execution)
