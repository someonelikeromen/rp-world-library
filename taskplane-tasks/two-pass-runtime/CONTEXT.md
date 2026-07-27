# Two-Pass Runtime — Context

**Last Updated:** 2026-07-27
**Status:** Bootstrap
**Next Task ID:** TPR-005

---

## Current State

This task area owns the long-term implementation of `RP Runtime Orchestrator` for the pi-rp project. It is separate from the world archive WCA task area and must not modify world archive source extraction tasks unless explicitly requested.

The current phase is P0 bootstrap. Runtime implementation has not started.

## Scope

Owns:

- `docs/rp-two-pass-runtime-system-plan.md`
- `docs/rp-two-pass-runtime-iteration-plan.md`
- `docs/rp-two-pass-runtime-roadmap.md`
- `docs/rp-two-pass-runtime-acceptance.md`
- `docs/rp-two-pass-runtime-adr.md`
- `.pi/extensions/rp-runtime-orchestrator*`
- `prompts/rp-runtime/*`
- future `memory/turn-ledger.jsonl` schema and runtime handling
- `taskplane-tasks/two-pass-runtime/*`

Does not own:

- RP story progression.
- Character card narrative state.
- World archive WCA tasks.
- Release copy `E:/pi-rp`.

## Rules

1. Follow `AGENTS.md` Windows environment rule.
2. Do not rely on Linux-only shell behavior for task success.
3. Do not start orchestrator batches without user confirmation.
4. Do not use LLM summaries as source facts; preserve Source Bundle quotes and source IDs.
5. Do not implement high-risk lifecycle, custom message, or `--no-skills` behavior without explicit task scope and user confirmation.

## Reference Docs

- `docs/rp-two-pass-runtime-system-plan.md`
- `docs/rp-two-pass-runtime-iteration-plan.md`
- `docs/rp-two-pass-runtime-roadmap.md`
- `docs/rp-two-pass-runtime-acceptance.md`
- `docs/rp-two-pass-runtime-adr.md`
- `AGENTS.md`

## Initial Task Batch

| ID | Status | Purpose |
|---|---|---|
| TPR-001 | Staged | Validate P0 bootstrap docs, config, and task area. |
| TPR-002 | Staged | Draft P1 Source Bundle and packet schema implementation plan. |
| TPR-003 | Staged | Draft P2 hard-gate extension implementation plan. |
| TPR-004 | Staged | Audit pi extension docs/examples needed before runtime implementation. |

## Technical Debt / Future Work

- [ ] Create actual runtime extension package after P1/P2 design is reviewed.
- [ ] Add Windows-compatible validation commands once code exists.
- [ ] Decide whether taskplane config should eventually split project name from world archive wording.
