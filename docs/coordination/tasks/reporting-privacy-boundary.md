---
id: reporting-privacy-boundary
title: fix(eval-history): close whole-row and dynamic-SQL reads in the reporting privacy gate
owner: agent:claude
status: review
branch: fix/1366-reporting-privacy-boundary
area:
  - packages/eval-history/migrations/**
  - packages/eval-history/src/migrate/**
  - packages/eval-history/src/queries/**
  - packages/eval-history/README.md
  - docs/decisions/ADR-137-*
  - docs/decisions/ADR-130-*
  - docs/decisions/ADR-133-*
  - apps/showcase/src/routes/evals/.server/evalsPublicPayload.test.ts
started: 2026-10-18
updated: 2026-10-18
plan: (none)
pr: #1399
issue: #1366
---

## What

fix(eval-history): close whole-row and dynamic-SQL reads in the reporting privacy gate

## Status / next

- Current step: gate green, PR ready for review
- Blockers: none
- Next:
