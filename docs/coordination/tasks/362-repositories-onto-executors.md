---
id: 362-repositories-onto-executors
title: Migrate remaining api-server repositories onto @lcabrera/server executors
owner: agent:claude
status: review
branch: refactor/362-repositories-onto-executors
area:
  - packages/server/src/db/get-rows-count.util.ts
  - packages/server/src/db/get-rows-count.util.test.ts
  - apps/shared/src/features/carSales/**
  - apps/shared/src/features/enterpriseOrders/**
  - apps/shared/src/features/wideAlltypes150/**
  - apps/shared/src/features/dbSanity/**
  - apps/shared/src/utils/resolveSortRules.util.ts
  - apps/shared/src/utils/resolveSortRules.util.test.ts
  - apps/shared/src/types/api.types.ts
  - apps/shared/src/index.ts
  - apps/api-server/src/features/carSales/**
  - apps/api-server/src/features/enterpriseOrders/**
  - apps/api-server/src/features/wideAlltypes150/**
  - apps/api-server/src/features/dbSanity/**
  - apps/api-server-fast/src/features/carSales/**
  - apps/api-server-fast/src/features/enterpriseOrders/**
  - apps/api-server-fast/src/features/wideAlltypes150/**
  - apps/api-server-fast/src/features/dbSanity/**
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #362
---

## What

Follow-up to #352 (#361): migrate the remaining api-shared repositories
(carSales, enterpriseOrders, wideAlltypes150, dbSanity) onto `@lcabrera/server`
executors, so no hand-rolled `pool.query` survives in the api-servers.

- New `getRowsCount` executor in `@lcabrera/server` (the count sibling of
  `getMaxValue`; requires an explicit `column`).
- Repositories compose `selectRows` + `getRowsCount` with explicit per-table
  column constants; enterprise-orders filters map via the package's
  `toQueryFilters` (the same mapping the React Router app uses).
- Injected pool fully removed (`createApp`/`server.ts`/repos parameterless);
  dead plumbing deleted (`Queryable`, `QueryValue`, `CountRow`,
  `formatPgAdminQuery`, `buildOrderByClause`, `buildEnterpriseOrdersWhereClause`).

**Stacked on #361** (`refactor/352-distinct-onto-getpool`) — it depends on the
`getPool()` pool-source foundation from #352. Rebase onto `main` once #361 merges.

## Status / next

- Current step: full gate + PR.
- Blockers: merges after #361.
- Next: open PR.
