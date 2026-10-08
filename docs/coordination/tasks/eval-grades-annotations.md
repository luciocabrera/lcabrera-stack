---
id: eval-grades-annotations
title: Store annotations and human grades for the judge
owner: agent:claude
status: review
branch: feat/1281-eval-grades-annotations
area:
  - packages/eval-history/migrations/0003-*.sql
  - packages/eval-history/src/grades/**
  - packages/eval-history/src/annotations/**
  - packages/eval-history/src/envelope/**
  - packages/eval-history/src/queries/scratchConnections.service.ts
  - packages/eval-history/src/queries/reporting.integration.test.ts
  - packages/eval-history/scripts/annotate.mjs
  - packages/eval-history/scripts/grade.mjs
  - packages/eval-history/scripts/lib/**
  - packages/eval-history/scripts/seed-synthetic-history.mjs
  - packages/eval-history/package.json
  - packages/eval-history/README.md
  - package.json
  - COMMANDS.md
started: 2026-10-08
updated: 2026-10-08
plan: (none)
pr: '#1359'
issue: #1281
---

## What

Store annotations and human grades for the judge

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
