# Task: TPR-004 - Audit Pi Extension Runtime Docs

**Created:** 2026-07-27
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Read-only technical audit of Pi extension docs/examples. It informs high-risk implementation phases but does not change runtime code.
**Score:** 3/8 — Blast radius: 0, Pattern novelty: 2, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/two-pass-runtime/TPR-004-audit-pi-extension-runtime-docs/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Audit the Pi extension documentation and examples needed for implementing RP Runtime Orchestrator. Produce a focused implementation guidance note covering custom tools, lifecycle events, custom messages/rendering, preview/widget possibilities, context/prompt injection, and any risks or unknowns.

## Dependencies

- **None**

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/rp-two-pass-runtime-system-plan.md` — target lifecycle and widget architecture.
- `docs/rp-two-pass-runtime-acceptance.md` — P4/P5/P6 acceptance criteria.
- `docs/rp-two-pass-runtime-adr.md` — lifecycle, preview, and custom message decisions.
- `E:/nvm/v24.16.0/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — extension API.
- `E:/nvm/v24.16.0/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` — custom widget/rendering API if needed.
- `E:/nvm/v24.16.0/node_modules/@earendil-works/pi-coding-agent/docs/session-format.md` — session storage/message format if needed.
- `E:/nvm/v24.16.0/node_modules/@earendil-works/pi-coding-agent/examples/extensions/` — targeted examples only.

## Environment

- **Workspace:** `E:/pi-st`
- **Services required:** None

## File Scope

- `docs/rp-two-pass-runtime-roadmap.md`
- `docs/rp-two-pass-runtime-adr.md`
- `taskplane-tasks/two-pass-runtime/CONTEXT.md`
- `taskplane-tasks/two-pass-runtime/TPR-004-audit-pi-extension-runtime-docs/*`

## Steps

### Step 0: Preflight

- [ ] Required docs/examples paths exist or missing paths are noted
- [ ] Audit remains read-only except for output notes/docs

### Step 1: Audit extension primitives

- [ ] Custom tool registration findings documented
- [ ] Lifecycle event findings documented
- [ ] Context/prompt injection findings documented
- [ ] Session persistence/message storage findings documented

### Step 2: Audit preview/custom message feasibility

- [ ] Preview widget or custom UI feasibility documented
- [ ] Custom rendering/message feasibility documented
- [ ] Relevant examples identified with paths
- [ ] Unknowns and required experiments listed

### Step 3: Update implementation guidance

- [ ] Add concise findings to roadmap, ADR, or task STATUS
- [ ] Identify which future phases need explicit experiments
- [ ] Do not implement extension code

### Step 4: Testing & Verification

- [ ] Findings trace back to docs/example paths
- [ ] No project runtime files modified except docs/status notes
- [ ] No orchestrator batch started by this task

### Step 5: Documentation & Delivery

- [ ] Discoveries logged in STATUS.md
- [ ] Future task candidates added to roadmap or CONTEXT if needed

## Documentation Requirements

**Must Update:**
- `docs/rp-two-pass-runtime-roadmap.md` — add future experiment tasks if needed.
- `docs/rp-two-pass-runtime-adr.md` — add ADR only if docs force a design change.

**Check If Affected:**
- `docs/rp-two-pass-runtime-system-plan.md` — update only if feasibility contradicts the architecture.

## Completion Criteria

- [ ] Extension primitive findings documented
- [ ] Preview/custom message feasibility documented
- [ ] Relevant docs/examples paths recorded
- [ ] No runtime code implemented

## Git Commit Convention

- `docs(TPR-004): audit pi extension runtime docs`

## Do NOT

- Implement lifecycle hooks
- Implement custom UI or custom message code
- Start orch automatically
- Modify `E:/pi-rp`
- Load unrelated long docs beyond targeted sections needed for audit

---

## Amendments (Added During Execution)
