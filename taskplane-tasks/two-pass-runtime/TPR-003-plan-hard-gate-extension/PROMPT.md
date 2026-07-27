# Task: TPR-003 - Plan Hard Gate Extension

**Created:** 2026-07-27
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Produces the implementation plan for a new project extension tool. It does not implement code, but it defines a core runtime boundary.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 2, Security: 0, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/two-pass-runtime/TPR-003-plan-hard-gate-extension/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Create an implementation-ready plan for the first runtime extension milestone: `rp_submit_direction_packet`. The plan must specify tool parameters, validation behavior, render packet derivation, ledger pending behavior, failure responses, and Windows-compatible validation fixtures.

## Dependencies

- **Task:** TPR-002 (Source Bundle and packet schema plan should define P1 schema details)

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/rp-two-pass-runtime-system-plan.md` — hard gate architecture.
- `docs/rp-two-pass-runtime-acceptance.md` — P2 acceptance criteria.
- `docs/rp-two-pass-runtime-adr.md` — accepted hard gate constraints.
- `docs/rp-two-pass-runtime-roadmap.md` — phase sequencing.
- `E:/nvm/v24.16.0/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — pi extension tool API, read targeted sections only if needed.

## Environment

- **Workspace:** `E:/pi-st`
- **Services required:** None

## File Scope

- `docs/rp-two-pass-runtime-roadmap.md`
- `docs/rp-two-pass-runtime-acceptance.md`
- `docs/rp-two-pass-runtime-adr.md`
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`
- `taskplane-tasks/two-pass-runtime/TPR-003-plan-hard-gate-extension/*`

## Steps

### Step 0: Preflight

- [ ] Required files and paths exist
- [ ] TPR-002 dependency status checked

### Step 1: Define tool contract

- [ ] Tool name, label, description, parameters, and return shape defined
- [ ] Accepted and rejected response examples written
- [ ] LLM/代码 boundary documented for the tool

### Step 2: Define validation behavior

- [ ] Schema checks defined
- [ ] Source Bundle checks defined
- [ ] hidden/render firewall checks defined
- [ ] stateChanges/write summary checks defined
- [ ] Render Packet derivation rules defined

### Step 3: Define ledger and fixture plan

- [ ] Pending turn-ledger behavior planned
- [ ] Fixture directory and sample cases proposed
- [ ] Windows-compatible validation command or method proposed

### Step 4: Testing & Verification

- [ ] Plan checked against P2 acceptance criteria
- [ ] No runtime code implemented
- [ ] No lifecycle behavior implemented

### Step 5: Documentation & Delivery

- [ ] Roadmap updated with follow-up implementation task if needed
- [ ] Discoveries logged in STATUS.md

## Documentation Requirements

**Must Update:**
- `docs/rp-two-pass-runtime-roadmap.md` — add follow-up implementation task candidate.
- `docs/rp-two-pass-runtime-acceptance.md` — refine P2 criteria if needed.

**Check If Affected:**
- `docs/rp-two-pass-runtime-adr.md` — add ADR only for new binding decisions.

## Completion Criteria

- [ ] `rp_submit_direction_packet` implementation plan is complete
- [ ] Validation and failure behavior are precise
- [ ] No runtime code implemented
- [ ] Follow-up P2 implementation task can be created from this plan

## Git Commit Convention

- `docs(TPR-003): plan hard gate extension`

## Do NOT

- Implement the extension tool
- Add lifecycle hooks
- Start orch automatically
- Modify `E:/pi-rp`
- Touch RP story memory or character cards

---

## Amendments (Added During Execution)
