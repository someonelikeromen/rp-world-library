# wave-014 - Relationship Candidates And Formal Relationship Audit

Status: passed after internal generator -> auditor -> fixer -> auditor rerun.

Scope: extract source-backed formal relationships and keep weaker, merge-sensitive, or route-variant relationships as candidates.

Boundary note: prior wave outputs were not consumed as authoritative inputs by this lane. Entity IDs therefore use conservative pilot IDs and every formal edge retains line sourceRefs for later merge reconciliation.
