---
name: shared-change-review
description: Review a completed repository change as the non-writing agent before handoff or merge.
---

# Change Review

Read `AGENTS.md` and identify the declared Owner. Act only as the read-only
Reviewer unless an explicit handoff makes you the new Owner.

Review the actual working-tree diff and relevant surrounding code. Run focused,
non-mutating checks when they add evidence. Do not fix findings, format files,
update snapshots, install dependencies, or otherwise modify the tree.

Prioritize correctness, regressions, security, data loss, and missing
verification. Give each finding a severity, file and line, risk, and concrete
recommendation. Finish with checks run, residual risks, and `No blocking
findings` when no actionable finding remains.
