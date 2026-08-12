---
id: enterprise-order-filter-contract
title: Guard or converge the drifted enterprise-order filter copies
owner: agent:claude
status: review
branch: fix/567-enterprise-order-filter-contract
area:
  - apps/shared/src/features/enterpriseOrders/**
  - apps/shared/ARCHITECTURE.md
  - apps/api-server/src/features/enterpriseOrders/**
  - apps/api-server-fast/src/features/enterpriseOrders/**
  - apps/react-router/src/routes/enterprise-orders/filterContract.test.ts
  - apps/api-server/src/ARCHITECTURE.md
  - docs/decisions/ADR-064-*
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: '#637'
issue: #567
---

## What

The enterprise-order column-filter shape was written down five times and the
three app-side copies had drifted: both packages allow a number filter's value
to be absent while the user is typing, all three app copies required it, so the
API servers answered 400 for a payload the React Router route serves.

`api-shared` now aliases `@lcabrera/server`'s contract instead of restating it,
and the two copies that cannot be types — the Zod schema in `apps/api-server`
and the JSON Schema in `apps/api-server-fast` — are guarded behaviourally
against one shared statement of the accepted states (ADR-064).

## Status / next

- Current step: implemented, full gate green, PR #637 open as a draft
- Blockers: none
- Next: verification, then ready for review
