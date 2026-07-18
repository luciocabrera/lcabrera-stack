---
id: coverage-report-phase-2
title: Coverage report Phase 2 — add node-runtime + scan-ingestion
owner: agent:claude
status: review
branch: chore/reland-coverage-phase-2
area:
  - scripts/coverage-report.mjs
  - docs/tooling/coverage-reporting.md
started: 2026-07-18
updated: 2026-07-18
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/35
---

## What

Phase 2 of the per-workspace coverage report (see
[docs/tooling/coverage-reporting.md](../../tooling/coverage-reporting.md)). Adds
`@repo/node-runtime` and `@repo/scan-ingestion` (both DB-free `test:coverage`) to
`COVERAGE_REPORT_WORKSPACES`. `packages/utils` was evaluated and deferred — it has
no test files.

**Re-land:** the original Phase 2 PR (#33) was merged into base
`feat/per-workspace-coverage-report` instead of `main` — and that branch had
already merged to `main` via #32 a minute earlier, so #33's commits never reached
`main`. This branch re-applies the same reviewed change directly onto `main`.

Also performs the coordination cleanup the protocol calls for now that #32 and #34
merged: deletes the completed `per-workspace-coverage-report` and `ui-coverage-95`
task files.

## Status / next

- Current step: change re-applied on a fresh branch off main; board regenerated
- Blockers: none
- Next: quality gate, open PR to main, merge when green
