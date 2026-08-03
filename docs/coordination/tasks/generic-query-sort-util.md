---
id: generic-query-sort-util
title: Promote toOrderQuerySort to a shared @lcabrera/ui generic
owner: agent:claude
status: active
branch: refactor/493-generic-query-sort-util
area:
  - packages/ui/src/routing/shared/**
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/routes/api/enterprise-orders-paginated/**
started: 2026-08-03
updated: 2026-08-03
plan: (none)
pr: '#494'
issue: #493
---

## What

`apps/react-router`'s `config/toOrderQuerySort` util was table-agnostic: it skipped
the synthetic `actions` column and renamed `columnKey` → `column`. Promote it to
`@lcabrera/ui/routing/shared/toQuerySort`, composing the `sanitizeSorting` that
already lives beside it, and delete the app-local copy plus a second hand-rolled
copy's worth of duplication.

## Status / next

- Current step: implemented; gate green in both workspaces
- Blockers: none
- Next: flip PR #494 out of draft
