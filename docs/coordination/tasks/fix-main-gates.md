---
id: fix-main-gates
title: Restore main: API-surface snapshot and S8705 argv validation
owner: agent:claude
status: review
branch: chore/915-fix-main-gates
area:
  - reports/api-surface/**
  - scripts/lib/gh-exec.mjs
  - scripts/lib/pr-queue-*.mjs
  - scripts/pr-threads.mjs
  - packages/repo-standards/scripts/cli-input*
started: 2026-08-24
updated: 2026-08-24
plan: (none)
pr: #916
issue: #915
---

## What

Restore main: API-surface snapshot and S8705 argv validation

## Status / next

- Current step: #916 ready for review, `check:safe` green locally (EXIT=0)
- Blockers: none
- Next: Sonar re-analysis on the PR head, then address review comments and merge
