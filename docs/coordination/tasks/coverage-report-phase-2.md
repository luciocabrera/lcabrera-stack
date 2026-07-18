---
id: coverage-report-phase-2
title: Coverage report Phase 2 — add node-runtime + scan-ingestion
owner: agent:claude
status: review
branch: feat/coverage-report-phase-2
area:
  - scripts/coverage-report.mjs
  - docs/tooling/coverage-reporting.md
started: 2026-07-18
updated: 2026-07-18
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/33
---

## What

Phase 2 of the per-workspace coverage report (see
[docs/tooling/coverage-reporting.md](../../tooling/coverage-reporting.md)). Adds
`@repo/node-runtime` and `@repo/scan-ingestion` (both DB-free `test:coverage`) to
`COVERAGE_REPORT_WORKSPACES`. `packages/utils` was evaluated and deferred — it has
no test files.

**Stacked on [per-workspace-coverage-report](./per-workspace-coverage-report.md)
(PR #32)** — this branch is based on `feat/per-workspace-coverage-report`, so the
two tasks intentionally share `scripts/coverage-report.mjs` and the doc. Retarget
this PR's base to `main` once #32 merges. The area overlap with that task is this
stack, not a collision with another owner.

## Status / next

- Current step: change made + verified (`vp run coverage:report` → 5 workspaces)
- Blockers: waiting on #32 to merge, then retarget base to main
- Next: quality gate, open stacked PR
