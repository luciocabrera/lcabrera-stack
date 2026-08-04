---
id: suppressions-status-required
title: Require a status on every approved suppression entry
owner: agent:claude
status: review
branch: chore/514-suppressions-status-required
area:
  - scripts/verify-suppressions.mjs
  - scripts/lib/suppressions.mjs
  - scripts/lib/suppressions.test.mjs
  - scripts/lib/suppressions-gate.test.mjs
  - docs/agents/public-package-suppressions.md
  - docs/agents/public-package-suppressions.json
  - docs/coordination/tasks/suppressions-provisional-gate.md
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: '#521'
issue: #514
---

## What

Require a status on every approved suppression entry. Nothing made an `approved`
entry carry a `status`, so deleting the field silenced it as effectively as
discharging it and the gate exited 0 — a third way past the register that its
own doc said did not exist.

Also sweeps the merged `suppressions-provisional-gate` claim (PR #513), which is
why that task file is listed in `area` above.

## Status / next

- Current step: implemented; the new lane exercised against a planted status-less
  entry and against a planted unrecognised value, and the tests confirmed failing
  against the pre-change implementation
- Blockers: none
- Next: review
