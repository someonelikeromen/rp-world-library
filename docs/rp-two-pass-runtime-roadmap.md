# pi-rp Two-Pass Runtime Roadmap

> 本路线图跟踪 `RP Runtime Orchestrator` 的长期实现状态。总体架构见 `docs/rp-two-pass-runtime-system-plan.md`，自动迭代机制见 `docs/rp-two-pass-runtime-iteration-plan.md`。

## Current Status

- **Overall phase:** P0 bootstrap
- **Implementation status:** Not started
- **Runtime extension:** Not created
- **Task area:** `taskplane-tasks/two-pass-runtime/`
- **Task prefix:** `TPR`
- **Next task ID:** TPR-005

## Phase Map

| Phase | Status | Goal | Depends On | Notes |
|---|---|---|---|---|
| P0 | In Progress | Roadmap, acceptance, ADR, task area bootstrap | None | Current bootstrap phase. |
| P1 | Planned | Source Bundle + packet schema | P0 | Must preserve original quotes and sourceId. |
| P2 | Planned | `rp_submit_direction_packet` hard gate | P1 | First executable extension milestone. |
| P3 | Planned | A9 Settlement Final Gate | P2 | Blocks incomplete settlement before render. |
| P4 | Planned | Lifecycle orchestration | P2, P3 | High-risk; requires explicit confirmation before implementation. |
| P5 | Planned | Editorial Review + Preview Widget | P4 | Requires draft capture and review verdict flow. |
| P6 | Planned | B8 Final Gate + `rp-prose` custom message | P5 | High-risk message publication change. |
| P7 | Planned | turn-ledger / chronology / rerender | P6 | Enables fact-preserving prose rerender. |
| P8 | Planned | On-demand skill/prompt assembly | P7 | Reduces main-context rule pressure. |
| P9 | Planned | Controlled `--no-skills` evaluation | P8 | Must not break `.pi/skills/` until runtime is proven. |

## Initial Task Batch

| Task | Status | Purpose |
|---|---|---|
| TPR-001 | Staged | Validate P0 bootstrap docs, config, and task area. |
| TPR-002 | Staged | Draft P1 Source Bundle and packet schema task plan. |
| TPR-003 | Staged | Draft P2 hard-gate extension task plan. |
| TPR-004 | Staged | Audit current pi extension examples/docs needed before implementation. |

## Batch Rules

1. Do not start a task batch without user confirmation.
2. Do not implement runtime code in P0 tasks unless a task explicitly says so.
3. Do not modify `E:/pi-rp`.
4. Do not write RP story memory or character card state during runtime maintenance work.
5. High-risk phases P4, P6, and P9 require a separate user confirmation.

## Next Decision

After P0 tasks are reviewed, decide whether to start P1 with a small schema-only implementation batch.
