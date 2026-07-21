---
id: scripts-lib-test-coverage
title: Give the root scripts/ gate logic a test runner and cover the load-bearing modules
owner: agent:claude
status: active
branch: test/scripts-lib-coverage
area:
  - scripts/lib/**
  - package.json
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #209
---

## What

Root `scripts/` is not a pnpm workspace, so `vp run -r test` never reached it and
none of the gate logic under `scripts/lib/` had a single test — including the
spec behind the commit-msg hook, the coordination register validators, and the
documented-path classifier.

Same failure class as #202/#205: a guard whose logic stops matching reports
exactly what compliant input reports.

## Status / next

- Current step: `test:scripts` task added and chained into `test:all`/`test:ci`;
  60 tests across the four load-bearing modules; a deliberate regression in each
  verified to fail.
- Blockers: none.
- Next: quality gate, then PR.
