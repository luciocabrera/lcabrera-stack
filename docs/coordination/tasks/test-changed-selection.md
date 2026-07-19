---
id: test-changed-selection
title: Add change-based test selection (vp run test:changed) for local + CI
owner: agent:claude
status: review
branch: feat/test-changed-selection
area:
  - scripts/test-changed.mjs
  - scripts/lib/affected-tests.mjs
  - scripts/lib/workspace-scopes.mjs
  - scripts/pr-labels.mjs
started: 2026-07-19
updated: 2026-07-19
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/49
---

## What

Add a `vp run test:changed` command that runs tests only for the workspaces a git
diff touched, plus their transitive workspace dependents (so a `packages/ui`
change still exercises `apps/react-router`). Root/shared changes fall back to the
full suite. Mirrors `test:ci`'s per-workspace task substitution (scan packages →
`test:unit`, `vite-react-compiler` → `test:ci`). Wired into CI's `unit-tests` job
on pull requests; pushes to `main` keep running the full `test:ci`.

## Status / next

- Current step: implemented + gates green (oxlint, biome, commands/scripts/coordination
  verify, fmt, fallow audit); real run on a leaf scope passed. Opening PR.
- Blockers: none
- Next: open PR, record its number here, merge, then delete this task file
