---
id: capability-on-loader-meta
title: refactor(ui): single-source table capability declaration on the loader meta
owner: agent:claude
status: review
branch: refactor/564-capability-on-loader-meta
area:
  - packages/ui/src/components/TableRouteView/**
  - packages/ui/src/hooks/useTableRoutePage.hook.ts
  - packages/ui/src/routing/loaders/createTableRouteLoader.util.ts
  - apps/react-router/src/routes/**
  - apps/admin_system/src/routes/**
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: '#632'
issue: #564
---

## What

refactor(ui): single-source table capability declaration on the loader meta

## Status / next

- Current step: implemented, full gate green, PR #632 open as a draft
- Blockers: none
- Next: independent review, then ready the PR

Outside the declared `area`, this change also touches `TableMetaState`
(`packages/ui/src/components/Table/Table.types.ts`) — the two capability flags
have to live on the meta type they are declared through — plus the docs for what
changed, a changeset and the API-surface snapshot.
