---
id: per-workspace-coverage-report
title: Per-workspace + monorepo coverage in the CI PR comment
owner: agent:claude
status: review
branch: feat/per-workspace-coverage-report
area:
  - scripts/coverage-report.mjs
  - packages/vite-configs/vite.run.shared.config.ts
  - .github/workflows/check-safe.yml
  - docs/tooling/coverage-reporting.md
started: 2026-07-18
updated: 2026-07-18
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/32
---

## What

The CI "Coverage Report" PR comment currently shows a single app's totals
(react-router / `vite-react-compiler`, because `test:ci` runs its coverage last
and the comment reads that one `coverage-summary.json`). This work makes the
comment show **one row per workspace plus a monorepo-wide total**, starting with
the three most critical public-facing surfaces:

- `packages/ui`
- `packages/data-access`
- `apps/react-router` (`vite-react-compiler`)

Mechanism:

- Add the `json-summary` reporter to the shared `VITEST_COVERAGE_FLAGS` so every
  workspace's `test:coverage` emits `coverage-summary.json` (react-router already
  does via its own `test:ci` script).
- New `scripts/coverage-report.mjs` + root `coverage:report` script reads each
  target workspace's summary, aggregates a monorepo total, writes
  `coverage/monorepo-coverage-summary.json`.
- The `unit-tests` job runs `coverage:report`; the PR-comment step renders the
  matrix.
- `docs/tooling/coverage-reporting.md` documents the system and the phased plan
  for adding the remaining workspaces (packages first).

Also edits (shared, high-traffic — not claimed as narrow area globs): root
`package.json` (add `coverage:report`), `COMMANDS.md` (document it, gated by
`commands:verify`).

## Status / next

- Current step: PR #32 open, in review. Quality gate green; live `coverage:report` verified.
- Blockers: none
- Next: address review, then merge and delete this task file (Phase 2 = remaining packages, tracked in docs/tooling/coverage-reporting.md)
