# pi-rp Two-Pass Runtime ADR

> Architecture Decision Record for `RP Runtime Orchestrator`. Add short dated entries when decisions become binding for implementation tasks.

## ADR-001: Use Runtime Mechanism Instead Of More Long Rules

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Two-Pass Prose Render will be absorbed as runtime orchestration, packet schemas, hard gates, lifecycle handling, preview, and ledger rather than another long always-loaded rule file.
- **Reason:** The existing project already has heavy rules. More prose rules increase non-compliance risk.
- **Consequence:** Implementation tasks should favor code-enforced boundaries and staged context loading.

## ADR-002: Source Bundle Must Preserve Original Quotes

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Retrieval/query stages must find correct original text or structured entries and pass exact quotes with source IDs. LLM summaries cannot replace source facts.
- **Reason:** Source-backed RP needs auditability and prevents second-hand summary drift.
- **Consequence:** Packet schemas and final gates must track source IDs and reject missing source provenance for sourced facts.

## ADR-003: Pass A And Pass B Require Final Gates

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Pass A has A9 Settlement Final Gate. Pass B has B8 Render Final Gate.
- **Reason:** Stage boundaries need explicit final approval, not just intermediate validation.
- **Consequence:** No render starts before A9 passes. No prose publishes before B8 passes.

## ADR-004: Editorial Review Is Required Before Publication

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Pass B includes an Editorial Review role that evaluates draft prose against Render Packet, Source Bundle, style, continuity, and character/world constraints.
- **Reason:** Draft generation and quality judgment are distinct tasks. A review role can decide approve, rewrite, or return-to-pass-a.
- **Consequence:** Preview and B8 must account for editorial verdicts.

## ADR-005: Preview Widget Is Runtime Safety Layer

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Preview Widget is required, but it is not a player-facing frontend panel or choice widget.
- **Reason:** Draft prose must be captured and inspected before formal publication.
- **Consequence:** The runtime should distinguish draft/candidate/approved/published states.

## ADR-006: Lifecycle Orchestration Is Required For Complete System

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Full implementation must use pi lifecycle events to separate settlement, render, preview, and publication.
- **Reason:** Prompt-only separation leaves hidden facts and draft text in the same context.
- **Consequence:** Lifecycle work is high risk and requires explicit user confirmation before implementation.

## ADR-007: Controlled --no-skills Only After Runtime Maturity

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** `--no-skills` is a future controlled evaluation, not an immediate switch.
- **Reason:** Current project relies on `.pi/skills/`; disabling automatic skill discovery too early would break routing.
- **Consequence:** Runtime must first prove explicit staged module loading before any real `--no-skills` run.

## ADR-008: Long-Term Iteration Must Be Batch-Governed

- **Date:** 2026-07-27
- **Status:** Accepted
- **Decision:** Pi may help long-term implementation through roadmap/taskplane/orchestrator batches, but every batch requires user confirmation and review.
- **Reason:** Prevents infinite autonomous mutation and keeps high-risk runtime changes auditable.
- **Consequence:** No automatic `orch_start` of a new batch without explicit user approval.
