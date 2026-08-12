---
id: group-query-emission
title: feat(server): group-query-builder with GROUPING SETS emission and alias safety
owner: agent:claude
status: review
branch: chore/562-group-query-emission
area:
  - packages/server/src/db/group-query-builder/**
  - packages/server/package.json
  - .changeset/**
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/609
issue: #562
---

## What

feat(server): group-query-builder with GROUPING SETS emission and alias safety

## Status / next

- Current step: builder + suites landed, full gate green; PR open
- Blockers: none
- Next: land the PR; #568 and #573 stay blocked on their own dependencies
