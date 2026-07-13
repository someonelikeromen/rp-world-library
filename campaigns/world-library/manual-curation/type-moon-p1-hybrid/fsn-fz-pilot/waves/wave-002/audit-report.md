# wave-002 Audit Report

Status: passed
Model: lt-yuyu/gpt-5.5
Scope: Canonical ID manifest initial pass.

## Audit Checks

- Output remains under `waves/wave-002/`.
- IDs use the locked graph type set where applicable: character, faction, concept, system, ability, timeline-period.
- Formal ID records carry `sourceRefs`, `sourceType`, `credibility`, `evidenceLevel`, and `canonStatus`.
- Continuity, timeline, variant, same-entity, related-form, and do-not-merge fields are present for character records.
- Shirou and Archer are related but not merged.
- FSN Rider and FZ Rider-class candidate are split.
- FSN Assassin/Sasaki and HF True Assassin/Hassan are split.
- FZ class-only Servants without identity evidence remain candidate-only.

## Findings

No blocking findings remain.

## Residual Risk

FZ Servant identities are under-specified in the current source layer. Candidate-only placeholders preserve class observations without formalizing unsupported Heroic Spirit names.
