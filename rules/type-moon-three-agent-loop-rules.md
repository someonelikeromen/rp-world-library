# Type-Moon Three-Agent Loop Rules

## 0. Status and Scope

This file is a mandatory rule layer for Type-Moon / FGO p1-hybrid archival work.

It applies to all future work under:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/
```

It is especially binding for FGO script p1 pilots and later correction passes.

When this rule file conflicts with an ad-hoc plan, the ad-hoc plan must be revised before execution. Do not execute a conflicting plan.

## 1. No Plan Deviation Rule

Before any write or agent launch, the assistant must present the concrete plan and wait for explicit user confirmation.

After confirmation, the assistant must execute only the confirmed plan.

Forbidden without a new confirmed plan:

```text
new output families
new canonical layers
new wrapper directories
migration to curated
publication previews
source import changes
old pilot rewrites
post-audit enhancements
```

If the assistant notices a useful improvement outside the plan, it must stop, describe the proposed change, and wait for confirmation.

## 2. True Three-Agent Separation

The following stages require true separated agent roles:

```text
chapter packet extraction
packet normalization
merge
relationship graph build
timeline build
appearance / ability / combat-effect canonical layer
final audit blocking fix
retrospective correction
```

A single agent saying it performed `Generator → Auditor → Fixer → Auditor rerun` internally does not satisfy this rule.

The minimum valid loop is:

```text
Generator
→ Auditor
→ Fixer
→ Auditor rerun
→ repeat Fixer / Auditor rerun until passed
```

The roles may run as separate `agent_team` steps in one graph, or as separate confirmed runs, but the audit and fix responsibilities must remain separated.

## 3. Mandatory Pass Gate

A stage may advance only when its final status includes all of the following:

```json
{
  "status": "passed",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true
}
```

Equivalent fields such as `latestAuditStatus: "passed"` are allowed only as additional evidence, not as a replacement for the gate fields above.

The following states must not advance:

```text
failed
partial
blocked
mixed without all required sub-stages passed
openIssues > 0
blockedIssues > 0
canAdvance != true
missing final-status.json
```

## 4. Generator Rules

Generator may create only outputs planned for the current stage.

Generator must preserve source-first evidence:

```text
sourceRefs or sourceRef
sourceType
credibility
canonStatus
raw source labels
raw event codes
raw time strings
triggerRaw
completionRaw
summaryRaw where present
```

Generator must write explicit `not-found-in-source` records when a mandatory extraction surface is absent from the source.

Generator must not:

```text
invent dates
invent events
invent relationships
invent appearance / ability / combat details
promote wiki/game/model-memory labels to formal facts
create unplanned canonical layers
write final acceptance
publish over old curated
```

## 5. Auditor Rules

Auditor is read-only.

Auditor must not write, edit, repair, normalize, or generate new facts.

Auditor output must classify each finding as one of:

```text
blocking issue
nonblocking risk
source limitation
process risk
```

Auditor must produce a machine-checkable audit report with at least:

```json
{
  "status": "passed | passed-with-nonblocking-risks | failed-blocking | blocked-insufficient-evidence",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true,
  "findings": [],
  "requiredFixes": []
}
```

Auditor must verify, as applicable:

```text
all expected source units were read
all required outputs exist
all formal facts have source evidence
mandatory visual / ability / combat-effect surfaces exist or have not-found records
no forbidden aggregate formal files exist
candidate-only material did not enter formal graph
known-issues files are not used as bypass
old curated/source imports are not modified according to available evidence
```

## 6. Fixer Rules

Fixer may only repair issues explicitly listed by Auditor as blocking or required.

Fixer must not repair nonblocking risks unless the user confirms a new fix plan.

Fixer must not expand scope.

Fixer must not add new output families not requested by Auditor.

Fixer must write a fix report mapping every action to the Auditor issue that required it.

Fixer output must include:

```json
{
  "status": "fixed | partially-fixed | blocked",
  "issuesHandled": [],
  "filesChanged": [],
  "unresolvedIssues": []
}
```

Fixer must not declare final pass. Only Auditor rerun can close the loop.

## 7. Auditor Rerun Rules

Auditor rerun must verify the Fixer output against the previous audit issues.

Auditor rerun must not enlarge scope unless the fix introduced new evidence of a blocking problem.

Only Auditor rerun can produce the stage `final-status.json` with:

```json
{
  "status": "passed",
  "latestAuditStatus": "passed",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true
}
```

If the stage still has issues, the loop returns to Fixer.

## 8. Parent Boundary Rules

The parent assistant may:

```text
present plans
start agents
read evidence
run read-only or structural validation tools
check file existence
check JSON/Markdown validity
check forbidden filenames
record status summaries
lock final acceptance after audit pass
retry the same failed stage after service errors
rollback files that the parent itself wrongly created
```

The parent assistant must not:

```text
generate formal facts
generate merged records
generate relationship edges
generate graph/timeline facts
generate visual/ability/combat wrappers
promote extracted/normalized data into canonical layers
fill missing source fields
create packet final-status wrappers from audit files
repair canonical outputs after audit without a Fixer agent
turn nonblocking risk into unapproved repair work
advance failed or partial outputs downstream
```

Parent structural validation is not a substitute for Auditor.

## 9. Nonblocking Risk Handling

If Auditor returns:

```text
passed-with-nonblocking-risks
```

The default action is:

```text
record the risk
lock accepted-with-nonblocking-risks if no blocking issues remain
do not fix the risk
```

Fixing a nonblocking risk requires a new explicit user-approved plan.

## 10. Blocking Handling

Only the following conditions trigger a Fixer loop:

```text
failed-blocking
blockedIssues > 0
openIssues > 0
canAdvance != true
missing required output
schema/gate failure
forbidden aggregate formal file
formal fact without source evidence
unsupported label promoted to formal fact
missing mandatory visual/ability/combat layer or not-found record when Auditor marks it blocking
```

## 11. Partial Output and Service Failure Rules

If an agent fails with:

```text
Service temporarily unavailable
Concurrency limit exceeded
RPC timeout
terminated
assistant-error
run-not-found
```

then the parent must check for a complete valid final-status gate.

If the gate is missing or not passed:

```text
do not advance
do not repair manually
retry the same stage with the same scope
```

If partial outputs exist, only a Generator/Fixer for that same stage may repair or overwrite them.

## 12. Known Issues Are Not Bypass

Files such as:

```text
known-issues.json
final-known-issues.json
migration-recommendation.md
```

must not be used to bypass failed gates.

Known issues may record limitations or risks, but do not replace:

```text
packet final-status
merge audit pass
graph/timeline audit pass
final audit pass
```

## 13. Forbidden Formal Aggregate Files

Formal output layers must not contain files named:

```text
characters.json
events.json
relationships.json
```

Formal facts must use:

```text
per-entity files
per-event files
per-edge files
index.json as index only
```

If a forbidden aggregate file is created, Auditor must mark it blocking unless the file is explicitly outside formal output scope.

## 14. Source-First Terminology Rule

Formal records may use only labels supported by current source evidence.

Unsupported game/wiki/model-memory labels may appear only as:

```text
aliasCandidates
unsupported-by-current-source
candidateOnly: true
legacy path slug
```

They must not appear as source-backed formal facts.

## 15. Visual / Ability / Combat Rule

FGO script p1 work must handle:

```text
character appearance
outfit/equipment visuals
Noble Phantasm / skill / magecraft / authority activation
summoning / transformation / sacrifice effects
combat effects, outcomes, costs, and aftermath
```

For each chapter or canonical layer, source-backed records or explicit `not-found-in-source` records are mandatory.

If Auditor marks missing visual/ability/combat coverage as blocking, a Fixer agent must repair it.

If Auditor marks it nonblocking, record the risk and do not repair without a new plan.

## 16. Graph and Timeline Derived-Only Rule

Graph and timeline outputs are derived indexes.

They must not become primary fact stores.

Graph/timeline builders must not introduce new formal facts.

Every formal graph edge must resolve back to audited relationship/event records and include source evidence and temporal evidence.

Co-occurrence and candidate relations remain candidates.

## 17. Retrospective Correction Rule

Existing pilots that did not strictly follow this protocol must not be parent-repaired directly.

Use:

```text
Retrospective Auditor
→ Retrospective Fixer, only if required
→ Retrospective Auditor rerun
→ Final Auditor rerun, if acceptance status changes
```

The Auditor may decide that a previous result remains acceptable with nonblocking process risks. In that case, record the risk and do not fix.

## 18. Publication Boundary

No pilot output may overwrite:

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/
```

Publication, migration, or curated-v2 preview requires a separate explicit user-approved plan.
