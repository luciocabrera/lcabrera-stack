---
id: departure-narration
title: Stop narrating the departed exercises in live docs and comments
owner: agent:claude
status: active
branch: chore/945-departure-narration
area:
  - scripts/lib/*.mjs
  - scripts/merge-coverage.mjs
  - docs/tooling/coverage-reporting.md
  - docs/tooling/fallow-summary.md
  - docs/agents/cross-app-abstraction.md
  - docs/agents/react-doctor-triage.md
  - packages/node-runtime/ARCHITECTURE.md
  - packages/repo-standards/scripts/adr-*.mjs
  - packages/repo-standards/scripts/*.test.mjs
  - apps/react-router/src/auth/ARCHITECTURE.md
started: 2026-08-25
updated: 2026-08-25
plan: (none)
pr: #946
issue: #945
---

## What

Live docs and comments still explained what the repo used to be — "those suites
left with CQMS (#683)", a `--home cqms` the CLI no longer resolves, fixtures
naming departed workspaces. Trimmed to the current fact; dated records
(`docs/decisions/`) stay verbatim.

## Status / next

- Current step: sweep applied, script + package tests green, running the gate
- Blockers: none
- Next: push, resolve review, merge
