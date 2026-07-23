---
id: 355-scripts-tests-on-pr
title: Run test:scripts on PRs that touch scripts/
owner: agent:claude
status: review
branch: test/355-scripts-tests-on-pr
area:
  - scripts/lib/affected-tests.mjs
  - scripts/lib/affected-tests.test.mjs
  - scripts/test-changed.mjs
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: '#356'
issue: #355
---

## What

Close the gap surfaced by #354: `test:scripts` (the 22 `scripts/` suites) ran
only in the full `test:ci` on `main`. The change-selector now flags a `scripts/`
code change and appends the root `test:scripts` group to `test:changed`, so those
suites run on PRs too. typecheck/lint are untouched (lint already runs; scripts
aren't type-checked).

## Status / next

- Current step: selector + runner + markdown + tests done; self-validating (this
  PR's own CI runs test:scripts). Gate green. Opening PR.
- Blockers: none.
- Next: PR; this closes out the change-based-selection improvements.
