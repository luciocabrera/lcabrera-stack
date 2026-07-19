---
id: typecheck-changed-selection
title: Scope the Quality Gate's typecheck to changed workspaces
owner: agent:claude
status: active
branch: feat/typecheck-changed-selection
area:
  - scripts/run-changed.mjs
  - scripts/lib/changed-runner.mjs
  - scripts/test-changed.mjs
  - scripts/lib/affected-tests.mjs
started: 2026-07-19
updated: 2026-07-19
plan: (none)
pr: (none)
---

## What

Extend the change-based selection (shipped for tests in PR #49) to the Quality
Gate's `typecheck:all` step — the slowest per-workspace part of the gate. A
generic `run-changed.mjs <task>` runs `vp run --filter <affected> <task>` for the
workspaces a diff changed plus their transitive dependents, falling back to the
full run on a shared/root change and on pushes to `main`. Reuses the
`resolveAffected` core from `affected-tests.mjs`; shared runner helpers move to
`scripts/lib/changed-runner.mjs` so `test-changed.mjs` and `run-changed.mjs` don't
duplicate them. `vp check`'s repo-wide tsgolint pass stays as a type-aware net.

## Status / next

- Current step: implementing generic runner + typecheck wiring
- Blockers: none
- Next: package.json + COMMANDS.md + check-safe.yml quality-gate step, gate + PR
