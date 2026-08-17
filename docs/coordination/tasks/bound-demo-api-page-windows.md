---
id: bound-demo-api-page-windows
title: Bound the page window in both demo API servers
owner: agent:claude
status: review
branch: chore/731-bound-demo-api-page-windows
area:
  - apps/api-server/**
  - apps/api-server-fast/**
  - apps/shared/**
started: 2026-08-15
updated: 2026-08-16
plan: (none)
pr: 735
issue: #731
---

## What

Bound the page window in both demo API servers, and the ORDER BY term count on
the reads that forwarded it unbounded.

## Status / next

- Current step: PR #735 open for review, full gate green
- Blockers: none
- Next:
  - Review of #735.
  - The live-database acceptance criterion is unverified — this environment has
    no Docker, no reachable Postgres and no `psql`. Recorded in the PR's Known
    Limitations; a reviewer with a database up should run it.
  - Follow-up #736 filed for `/_api/filter-options`, which is unbounded through
    the published `@lcabrera/api`. Deliberately not folded in here.
