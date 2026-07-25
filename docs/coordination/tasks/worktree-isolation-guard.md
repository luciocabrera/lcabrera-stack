---
id: worktree-isolation-guard
title: Make worktree isolation the default and check that the shared clone stays on main
owner: agent:claude
status: active
branch: chore/385-worktree-isolation-guard
area:
  - scripts/coordination-claim.sh
  - scripts/deps-refresh.sh
  - scripts/verify-coordination.mjs
  - scripts/lib/checkout-isolation.mjs
started: 2026-07-25
updated: 2026-07-25
plan: (none)
issue: #385
pr: (none)
---

## What

`docs/coordination/README.md` says the primary checkout stays on `main` and each
agent works in a worktree. Nothing enforced it, and the default path violated it:
`coordination:claim` without `--worktree` ran `git checkout -b` in the shared
clone, and `deps-refresh.sh` branched wherever it was invoked.

- `coordination:claim` defaults to a worktree; `--in-place` is the explicit
  opt-out and `--worktree` stays accepted as a no-op.
- `coordination:verify` reports a primary checkout parked on a feature branch —
  a hard failure when the tree is clean, a warning when it is dirty, so it can
  never strand uncommitted work behind a gate that runs in `check:push`.
- `deps-refresh.sh` refuses to run in the shared clone.

CI is exempt by design: `actions/checkout` produces a primary checkout on a
feature branch every run, and a runner has no second agent to disturb.

## Status / next

- Current step: implemented and unit-tested; running the gate.
- Blockers: none.
- Next: open the PR, then delete this file when it merges.
