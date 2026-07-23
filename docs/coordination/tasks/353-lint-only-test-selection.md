---
id: 353-lint-only-test-selection
title: Skip test/typecheck selection for lint-only config changes
owner: agent:claude
status: review
branch: perf/353-lint-only-test-selection
area:
  - scripts/lib/affected-tests.mjs
  - scripts/lib/affected-tests.test.mjs
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #353
---

## What

Lint/format-only configs (the `vite-configs` eslint/oxlint/oxfmt factories, any
`eslint.config.mjs`) are dropped from the diff before change-based test/typecheck
selection, so a lint-only change selects nothing instead of forcing the full
suite (as #350 did). Safe because the linters gate those on every PR regardless.
Adds the first tests for `affected-tests.mjs`.

## Status / next

- Current step: filter + docstring + tests done; `test:scripts` green (22 files).
  Running the gate.
- Blockers: none.
- Next: PR. Separate follow-up worth filing — `test:scripts` isn't run on PRs at
  all today (only on `main`), so scripts-only changes get no test gate.
