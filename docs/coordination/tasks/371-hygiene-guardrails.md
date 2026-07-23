---
id: 371-hygiene-guardrails
title: Self-enforcing multi-agent hygiene guardrails
owner: agent:claude
status: active
branch: chore/371-hygiene-guardrails
area:
  - docs/coordination/**
  - scripts/housekeeping-prune.mjs
  - scripts/lib/housekeeping-prune.*.mjs
  - scripts/lib/coordination-reconcile.*.mjs
  - .github/workflows/pr-standards.yml
  - scripts/lib/commit-convention.mjs
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: 372
issue: #371
---

## What

Make multi-agent hygiene self-enforcing instead of manual (issue #371), after a
2026-07-23 audit found ~90 stale local branches, 4 orphaned worktrees, 3 orphaned
stashes, and the shared checkout parked on another agent's merged branch. Four
guardrails:

1. Worktree-per-agent + pinned-`main` convention (docs).
2. `vp run housekeeping:prune` — prune merged branches/worktrees; report (never
   destroy) un-PR'd/dirty/stashed work.
3. `coordination:verify` reconciliation — warn on task/branch/PR/worktree drift.
4. Stacked-PR base guard — flag a PR whose base is a non-`main` feature branch.

Likely split across more than one PR to respect one-concern-per-PR and the
`scripts:verify` per-file size cap.

## Status / next

- Current step: all four guardrails implemented + unit-tested; the new
  reconciliation check immediately surfaced 5 merged task files stranded on
  `main` (352, 362, board-status, oxlint-root, ssr-prod-start), now deleted.
- Blockers: none.
- Next: run the full quality gate, then open the PR against `main`.
