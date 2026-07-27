# Task: TPR-002 - Plan Source Bundle and Packet Schema

**Created:** 2026-07-27
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Produces an implementation-ready schema plan without runtime code. The design affects later extension behavior, so plan review is required.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 2, Security: 0, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/two-pass-runtime/TPR-002-plan-source-bundle-packet-schema/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Create an implementation-ready P1 design for Source Bundle, Direction Packet, Render Packet, and source traceability validation. This task must not implement runtime code; it prepares the exact schema and fixture expectations for a later implementation task.

## Dependencies

- **Task:** TPR-001 (P0 bootstrap validation should be complete or explicitly accepted)

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/rp-two-pass-runtime-system-plan.md` — source bundle and packet architecture.
- `docs/rp-two-pass-runtime-acceptance.md` — P1 acceptance criteria.
- `docs/rp-two-pass-runtime-adr.md` — source quote and final gate decisions.
- `docs/rp-two-pass-runtime-roadmap.md` — phase sequencing.

## Environment

- **Workspace:** `E:/pi-st`
- **Services required:** None

## File Scope

- `docs/rp-two-pass-runtime-roadmap.md`
- `docs/rp-two-pass-runtime-acceptance.md`
- `docs/rp-two-pass-runtime-adr.md`
- `docs/rp-two-pass-runtime-system-plan.md`
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`
- `taskplane-tasks/two-pass-runtime/TPR-002-plan-source-bundle-packet-schema/*`

## Steps

### Step 0: Preflight

- [ ] Required files and paths exist
- [ ] Dependencies satisfied or explicitly noted

### Step 1: Draft schema implementation plan

- [ ] Define Source Bundle fields, required/optional status, and validation rules
- [ ] Define Direction Packet fields, source references, and forbidden states
- [ ] Define Render Packet derived fields and hidden exclusion rules
- [ ] Define hash and ID strategy for sourceBundleId, turnId, sourceId, packet hashes

### Step 2: Define fixtures and validation cases

- [ ] Accepted fixture categories: world, card, memory, rule, style, tool-result
- [ ] Rejected fixture categories: empty quote, missing sourceId, hidden leak, packet fact without source
- [ ] Windows-compatible validation approach documented

### Step 3: Update roadmap/acceptance if needed

- [ ] Add any missing P1 acceptance detail
- [ ] Add implementation task candidates for P1 follow-up
- [ ] Do not implement runtime code

### Step 4: Testing & Verification

- [ ] Review schema plan against ADR-002 and acceptance P1
- [ ] Confirm no RP story memory or card state changed

### Step 5: Documentation & Delivery

- [ ] Discoveries logged in STATUS.md
- [ ] Follow-up implementation tasks noted in roadmap or CONTEXT

## Documentation Requirements

**Must Update:**
- `docs/rp-two-pass-runtime-acceptance.md` — if P1 criteria need more precision.
- `docs/rp-two-pass-runtime-roadmap.md` — to list follow-up P1 implementation task candidates.

**Check If Affected:**
- `docs/rp-two-pass-runtime-system-plan.md` — update only if schema design contradicts the architecture.
- `docs/rp-two-pass-runtime-adr.md` — add ADR only if a new binding schema decision is made.

## Completion Criteria

- [ ] P1 schema plan is implementation-ready
- [ ] Validation fixtures are defined
- [ ] No runtime code implemented
- [ ] Review-ready notes are in STATUS.md

## Git Commit Convention

- `docs(TPR-002): plan source bundle packet schema`

## Do NOT

- Implement `.pi/extensions/rp-runtime-orchestrator*`
- Start orch automatically
- Modify `E:/pi-rp`
- Replace original quotes with LLM summaries
- Touch RP character cards or story memory

---

## Amendments (Added During Execution)
