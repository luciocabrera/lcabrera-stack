---
id: enterprise-orders-followups
title: Enterprise-orders showcase follow-ups — generic count/filter builders, filter-contract relocation, auth hardening, live smoke test
owner: agent:claude
status: active
branch: feat/data-access-count-column-notilike
area:
  - packages/data-access/src/db/queryBuilder/**
  - packages/data-access/src/filters/**
  - packages/ui/src/types/filterOperators.types.ts
  - packages/ui/src/components/AppShell/**
  - apps/react-router/src/routes/enterprise-orders/config/**
  - apps/react-router/src/routes/enterprise-orders/server/**
  - apps/react-router/src/routes/api/**
  - apps/react-router/src/root/**
started: 2026-07-20
updated: 2026-07-20
plan: ~/.claude/plans/let-s-create-a-detailed-golden-map.md
pr: (none)
issue: (none)
---

## What

Post-merge follow-ups on the secured enterprise-orders Form showcase (epic #79),
delivered as four focused, sequential PRs:

- **PR A — `@repo/data-access` query builder:** `buildCountQuery` takes the column to
  count (drops the `count(id)` hardcode); add a `notIlike` (`NOT ILIKE`) comparison
  operator so text `notContains` filters are expressible generically.
- **PR B — filter-contract relocation:** move the shared column-filter types
  (`ColumnFilter`/`DateFilter`/…), the generic filter→`QueryFilter` mappers, and
  `emptyToUndefined` into `@repo/data-access/filters`; `@repo/ui`'s
  `filterOperators.types` re-exports them (63 Table-internal imports unchanged); the
  app imports the relocated mappers from data-access and drops the `count(*)` subquery
  workaround (now that PR A lets `buildCountQuery` count `order_id`).
- **PR C — auth hardening + logout UX:** generic session-actions slot on `@repo/ui`
  `AppShell` filled with the logout control; guard the `_action/enterprise-orders/delete`
  and `_api/enterprise-orders/paginated` resource routes with `authMiddleware`.
- **PR D — live-DB smoke test:** gated Vitest integration suite exercising
  login → guarded loader → create → view → edit → delete against real Postgres
  (behind an env flag so the DB-less CI unit job stays green).

## Status / next

- Current step: PR A — data-access query-builder enhancements.
- Blockers: none.
- Next: PR B relocation depends on PR A merging (notIlike + count column).
