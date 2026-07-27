# pi-rp Two-Pass Runtime Acceptance Criteria

> This document defines how each phase of `RP Runtime Orchestrator` is accepted. It is intentionally concrete so Taskplane workers and reviewers can determine pass/fail without relying on vague prose.

## Global Acceptance Rules

Every phase must satisfy:

1. Works in the Windows project environment.
2. Does not edit `E:/pi-rp` release copy directly.
3. Does not write RP story memory unless the task explicitly covers RP runtime state and is approved.
4. Does not mutate character cards except in controlled test fixtures or approved runtime integration tests.
5. Does not replace source quotes with LLM summaries.
6. Preserves existing `.pi/skills/` behavior unless a task explicitly targets skill loading.
7. Includes review notes or task STATUS evidence.

## P0: Bootstrap

Accepted when:

1. `docs/rp-two-pass-runtime-roadmap.md` exists.
2. `docs/rp-two-pass-runtime-acceptance.md` exists.
3. `docs/rp-two-pass-runtime-adr.md` exists.
4. `.pi/taskplane-config.json` has a separate `two-pass-runtime` task area with `TPR` prefix.
5. `taskplane-tasks/two-pass-runtime/CONTEXT.md` exists and tracks next task ID.
6. Initial `TPR-*` task packets exist with PROMPT.md and STATUS.md.
7. No orchestrator batch has been started without user confirmation.

## P1: Source Bundle + Packet Schema

Accepted when:

1. Source Bundle schema is defined with `sourceId`, `kind`, `ref`, `path`, `quote`, `usedFor`, and `visibility`.
2. Direction Packet schema includes `sourceBundleId` and source traceability for key facts.
3. Render Packet schema is derived from Direction Packet and never manually copied by LLM.
4. Schema validation rejects empty quotes and missing source IDs for sourced facts.
5. Documentation includes examples for world, card, memory, rule, style, and tool-result sources.

## P2: Hard Gate Tool

Accepted when:

1. `rp_submit_direction_packet` exists as a project extension tool.
2. The tool validates packet schema.
3. The tool rejects narrative packets with missing `visibleChanges` or `endWindow`.
4. The tool rejects hidden leakage into render-visible fields.
5. The tool returns a sanitized Render Packet.
6. The tool can be validated with at least one accepted and one rejected fixture.

## P3: A9 Settlement Final Gate

Accepted when:

1. A9 checks accepted Direction Packet, Source Bundle, state write summaries, and Render Packet hash.
2. A9 can return `pass`, `fix-required`, or `blocked`.
3. A9 identifies a return target such as A2, A5, A7, or A8.
4. A9 blocks Pass B if state changes are not written or explicitly blocked.

## P4: Lifecycle Orchestration

Accepted when:

1. Input routing marks narrative, panel, rerender, direct, maintenance, migration, debug, and iteration modes.
2. `before_agent_start` can inject stage-specific context.
3. `tool_result` can capture packet tool results.
4. `agent_end` prevents Pass A prose from being treated as final narrative output.
5. `agent_settled` can safely trigger render flow.
6. High-risk behavior is behind explicit configuration or confirmation.

## P5: Editorial Review + Preview Widget

Accepted when:

1. Draft prose is captured before publication.
2. Editorial Review receives Render Packet, player-visible Source Bundle, style context, prose continuity, and draft.
3. Editorial Review returns `approve`, `rewrite`, or `return-to-pass-a`.
4. Preview Widget tracks draft state: draft, editorial-reviewing, editorial-rewrite, linting, lint-failed, needs-pass-a, approved, published.
5. Failed drafts cannot be published.

## P6: B8 Final Gate + rp-prose

Accepted when:

1. B8 requires editorial approval and lint success before publication.
2. B8 returns `publish`, `rewrite`, `return-to-pass-a`, or `block`.
3. Published prose is represented as `rp-prose` custom message or equivalent runtime-distinguishable message.
4. Pass A analysis is not included in player prose.
5. Publication records message ID for ledger linkage.

## P7: turn-ledger / Chronology / Rerender

Accepted when:

1. `memory/turn-ledger.jsonl` or equivalent ledger records source bundle hash, packet hash, render hash, editorial result, preview ID, and prose message ID.
2. Chronology can reconstruct recent facts and prose relationship.
3. Rerender uses existing Render Packet and Source Bundle only.
4. Rerender does not rerun dice, combat, or state writes.

## P8: On-Demand Skill/Prompt Assembly

Accepted when:

1. Runtime can choose source retrieval, settlement, render, editorial, and maintenance prompts by route.
2. Runtime loads only necessary modules for each route.
3. Pass B does not receive status-write tools or hidden Source Bundle entries.
4. Maintenance route does not load RP prose rules unnecessarily.

## P9: Controlled --no-skills Evaluation

Accepted when:

1. Runtime works without relying on automatic skill injection in controlled tests.
2. Explicit skill/prompt loading still exposes required RP capabilities.
3. Existing `.pi/skills/` can still be used as module library.
4. Rollback to normal skill discovery is documented.
5. User explicitly approves any real `--no-skills` run.
