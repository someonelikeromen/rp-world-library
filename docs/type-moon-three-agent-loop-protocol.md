# Type-Moon Three-Agent Loop Protocol

## 0. Purpose

This protocol operationalizes the mandatory rules in:

```text
rules/type-moon-three-agent-loop-rules.md
```

It defines how Type-Moon / FGO p1-hybrid archive stages must be planned, executed, audited, fixed, and accepted.

The protocol is not an optional style guide. It is the execution procedure for all future Type-Moon p1-hybrid packet, merge, graph, timeline, final-fix, and retrospective correction work.

## 1. Execution Overview

The canonical loop is:

```text
Generator
→ Auditor
→ Fixer
→ Auditor rerun
→ repeat Fixer / Auditor rerun until passed
```

The stage can advance only after the Auditor rerun writes or verifies a final gate equivalent to:

```json
{
  "status": "passed",
  "latestAuditStatus": "passed",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true
}
```

A single agent may not substitute for the separated roles by claiming it performed the whole loop internally.

## 2. Stage Classification

### 2.1 Single-agent plus parent validation allowed

The following may be performed by one agent plus parent validation:

```text
prep gate
source inventory
source classification
work packet creation
source-text gate
line-addressable source text generation
```

Parent validation must check:

```text
expected files exist
JSON/Markdown validity
manifest status fields
packet count
source entry identity
no old curated/source import mutation according to available evidence
no forbidden formal aggregate filenames
```

### 2.2 True three-agent loop required

The following require separated roles:

```text
chapter packet extraction
normalization when it creates formal fragments
merge
relationship graph build
timeline build
appearance / ability / combat-effect canonical layer
final audit blocking fix
retrospective correction
```

## 3. Agent Role Contracts

### 3.1 Generator contract

Inputs:

```text
confirmed plan
work packet or stage manifest
source text / upstream passed outputs
schema requirements
rules/type-moon-three-agent-loop-rules.md
```

Outputs:

```text
planned stage outputs only
generation-report.json or stage equivalent
uncertainties / candidate-only records
not-found-in-source records for mandatory absent details
```

Generator must not write acceptance status or final pass.

### 3.2 Auditor contract

Inputs:

```text
confirmed plan
rules file
Generator outputs
source text / upstream gates
```

Outputs:

```text
audit-round-NNN.json or stage audit report
blocking issue list
nonblocking risk list
source limitation list
canAdvance decision
```

Auditor is read-only. It must not repair.

### 3.3 Fixer contract

Inputs:

```text
Auditor report
explicit blocking / required issue list
current stage outputs
```

Outputs:

```text
fixed stage outputs
fix-round-NNN.json
resolved/unresolved issue mapping
```

Fixer repairs only the Auditor-listed issues.

### 3.4 Auditor rerun contract

Inputs:

```text
previous audit report
fix report
fixed outputs
```

Outputs:

```text
audit-rerun report
final-status.json if passed
remaining issue list if not passed
```

Auditor rerun must close the gate or send the stage back to Fixer.

## 4. Packet Loop Procedure

For each chapter packet:

```text
Packet Generator
→ Packet Auditor
→ Packet Fixer, if needed
→ Packet Auditor rerun
```

Required packet directories:

```text
extracted/<arc>/<chapter>/
normalized/<arc>/<chapter>/
audit/packet-audits/<arc>/<chapter>/
```

Required reports:

```text
generation-report.json
audit-round-001.json
fix-round-001.json, if needed
audit-round-002.json or rerun equivalent
final-status.json
```

Required packet final status:

```json
{
  "schema": "tm-fgo-packet-final-status-v1",
  "status": "passed",
  "latestAuditStatus": "passed",
  "openIssues": 0,
  "blockedIssues": 0,
  "canAdvance": true
}
```

If `final-status.json` is missing, parent must not create a wrapper. A Fixer/Auditor rerun must produce it.

## 5. Packet Auditor Checklist

Packet Auditor must check:

```text
all expected raw events extracted
rawEventCode retained
raw time retained
triggerRaw retained
completionRaw retained
summaryRaw retained where present
dialogue lines represented or explicitly skipped
stage characters represented without leaking engine instructions into canon facts
appearance signals present or not-found recorded
outfit/equipment visual signals present or not-found recorded
ability / Noble Phantasm / magecraft / authority signals present or not-found recorded
combat-effect signals present or not-found recorded
formal records have sourceRefs/sourceType/credibility/canonStatus
unsupported labels remain candidates
no forbidden aggregate formal files
JSON validity according to allowed validation method
```

## 6. Merge Loop Procedure

Merge is not complete until it passes its own separated loop:

```text
Merge Generator
→ Merge Auditor
→ Merge Fixer, if needed
→ Merge Auditor rerun
```

Required merge outputs, when applicable to the plan:

```text
merged/index.json
merged/events/<arc>/<chapter>/*.json
merged/relationships/edges/<arc>/<chapter>/*.json
merged/appearances/<arc>/...
merged/abilities/<arc>/...
merged/combat-effects/<arc>/...
merged/character-stage-index.json or character indexes
merged/world-state-index.json or world indexes
timeline/<arc>/index.json
timeline/<arc>/master.json
graph/derived-index.json
graph/relationship-edge-index.json
candidates/alias-candidates.json
comparison/<stage>-comparison.json
audit/merge/audit-round-NNN.json
audit/merge/fix-round-NNN.json, if needed
audit/merge/final-status.json
audit/final-known-issues.json
audit/final-pass-report.json
```

Dedicated visual / ability / combat-effect canonical layers must be built if the confirmed plan requires them. If missing, Merge Auditor decides whether this is blocking or a nonblocking risk. Parent must not decide by repairing it.

## 7. Merge Auditor Checklist

Merge Auditor must check:

```text
all packet gates passed
all expected merged event files exist
all expected relationship edge files exist
event triggerRaw/completionRaw/summaryRaw retained or absence is explicitly source-limited
relationship edges have timelineId and timeRange/timeRangeRaw
formal records have sourceRefs/sourceType/credibility/canonStatus
visual/ability/combat-effect canonical layers satisfy the confirmed plan or risks are classified
not-found-in-source coverage survives merge or is linked
unsupported labels remain candidate-only
graph/timeline outputs are derived-only
no forbidden aggregate formal files exist
known-issues files are not bypasses
old curated/source imports were not modified according to available evidence
```

## 8. Graph Loop Procedure

If graph build is separate:

```text
Graph Generator
→ Graph Auditor
→ Graph Fixer, if needed
→ Graph Auditor rerun
```

Graph Generator may only derive from passed canonical records.

Graph Auditor checks:

```text
no new facts introduced
edgeRef points to merged relationship edge
candidate/co-occurrence is not formal edge
node types are correct
concept/system/location/faction not inserted into character graph as character
sourceRefs and temporal fields are preserved through references
```

Graph Fixer must repair the canonical source layer if the graph defect originates there. It must not only patch a derived graph file.

## 9. Timeline Loop Procedure

If timeline build is separate:

```text
Timeline Generator
→ Timeline Auditor
→ Timeline Fixer, if needed
→ Timeline Auditor rerun
```

Timeline Generator may only derive ordering and indexes from passed event records.

Timeline Auditor checks:

```text
raw time preserved
no invented exact dates
relative-only dates remain relative
orderIndex is stable
long events have start/middle/end nodes where required by plan
timeline stores refs/indexes, not sole fact bodies
```

## 10. Final Audit Procedure

Final audit is independent and read-only.

It must run only after stage-specific loops are passed.

Final audit does not replace packet/merge/graph/timeline audits.

If Final Auditor returns `failed-blocking`:

```text
Final Fixer
→ Final Auditor rerun
```

If Final Auditor returns `passed-with-nonblocking-risks`:

```text
record risks
lock accepted-with-nonblocking-risks
no unapproved repair
```

## 11. Status Locking

Final acceptance may be locked only after:

```text
all required gates passed
independent final audit passed or passed-with-nonblocking-risks
no blocking issues remain
publication boundary is preserved
```

Status files may include:

```text
STATUS.md
audit/final-acceptance.md
audit/final-status.json
```

Accepted states:

```text
accepted
accepted-with-nonblocking-risks
```

Nonblocking risks must remain visible in the acceptance text.

## 12. Service Failure and Retry Procedure

For service or account failures:

```text
Service temporarily unavailable
Concurrency limit exceeded
RPC timeout
terminated
assistant-error
```

Parent does:

```text
read step evidence
check whether valid final-status exists
if final-status missing or not passed, retry the same stage and same scope
```

Parent does not:

```text
change scope to a smaller unplanned finalization
repair partial outputs manually
advance downstream using partial outputs
```

A smaller repair/finalization plan is allowed only after the user confirms it as a new plan.

## 13. Retrospective Correction Procedure

For older pilots that did not follow true separated loops:

```text
Retrospective Auditor
→ Retrospective Fixer, only if blocking
→ Retrospective Auditor rerun
→ Final Auditor rerun, if acceptance changes
```

Retrospective Auditor may classify previous process deviations as:

```text
blocking issue
nonblocking process risk
accepted historical limitation
```

Nonblocking process risks are recorded, not repaired.

## 14. Parent Validation Commands and Tools

Parent validation may use structural/read-only tools to check:

```text
JSON validity
Markdown validity
file existence
counts
forbidden filenames
git status for boundary checks
```

Parent validation may not generate facts or canonical outputs.

If a validation command would generate files or transform content, it requires a new user-approved plan or must be delegated to the appropriate Generator/Fixer agent.

## 15. Ordeal Call Remediation Pattern

For the existing Ordeal Call pilot or similar cases:

1. Do not parent-repair outputs.
2. Start with a Retrospective Merge Auditor.
3. Auditor decides whether missing/partial structures are blocking or nonblocking.
4. If blocking, run Merge Fixer for listed issues only.
5. Run Merge Auditor rerun.
6. Run independent Final Auditor rerun if the acceptance state changes.
7. Lock status only after the loop passes.

## 16. No Publication Without Separate Plan

This protocol governs manual-curation pilots only.

Any movement into:

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/
campaigns/world-library/worlds/type-moon-nasuverse/curated-v2-pilot/
```

requires a separate user-confirmed migration/publication plan.
