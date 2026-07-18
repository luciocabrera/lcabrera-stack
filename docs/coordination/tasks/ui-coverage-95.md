---
id: ui-coverage-95
title: Raise @repo/ui unit-test coverage toward 95%
owner: agent:claude
status: active
branch: test/ui-coverage-95
area:
  - packages/ui/src/**/*.test.ts
  - packages/ui/src/**/*.test.tsx
started: 2026-07-18
updated: 2026-07-18
plan: (none)
pr: (none)
---

## What

Add MEANINGFUL unit tests to raise `@repo/ui` line coverage from 91.83% toward
≥ 95% (lifting functions/branches where natural). Tests only — no source edits.

Strategy: first exhaust the non-Table coverage gaps (safe, no collision), then
add additive Table **test files** to cross 95%.

## Deliberate overlap with `table-ui-fixes`

The `area` globs above intentionally cover `packages/ui/src/components/Table/**`
_test files_ even though `table-ui-fixes` (owner `agent:other`) actively owns
Table **source**. This is a **tests-only** overlap:

- I add/execute `*.test.ts(x)` for Table modules to gain coverage. I do **not**
  edit any Table source file.
- `coordination:verify` will emit an **overlap WARNING** for the intersecting
  `Table/**` area — this is expected and acceptable (warnings never fail the
  build). Our writes are disjoint at the file level (they touch source, I touch
  tests).
- **Merge sequencing:** merge `table-ui-fixes` first, then rebase this branch and
  re-run the Table tests — Table source changes may shift line counts or require
  test adjustments. Alternatively coordinate to land tests after their fixes.

## Status / next

- Current step: measuring baseline, writing non-Table tests first.
- Blockers: none.
- Next: work down the per-file uncovered-line list; re-measure after each batch.
