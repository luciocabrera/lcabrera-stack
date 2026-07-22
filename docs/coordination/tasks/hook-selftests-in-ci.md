---
id: hook-selftests-in-ci
title: Run the hook self-test matrices in CI
owner: agent:claude
status: review
branch: hook-selftests-in-ci
area:
  - scripts/claude-secrets-guard.mjs
  - scripts/verify-commit-msg.mjs
  - scripts/lib/secrets-guard*.mjs
  - scripts/lib/safe-read*.mjs
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: '#290'
issue: #130
---

## What

Both Claude Code hook scripts carried a `--selftest` assertion matrix that
nothing ever invoked. The secrets guard is the hook that DENIES tool calls, and
its cases include two false positives that blocked real work this week — both
regressions in a guard whose tests never ran.

Matrices moved to vitest files, so `test:scripts` runs them and `test:ci` runs
that. Adds containment coverage for `safe-read.mjs`, which had none.

## Status / next

- Current step: gate green, 200 script tests (was 156)
- Blockers: none
- Next: merge #290
