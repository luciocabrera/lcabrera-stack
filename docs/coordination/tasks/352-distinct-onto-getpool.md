---
id: 352-distinct-onto-getpool
title: Migrate api-server distinct repositories onto selectFilterOptions via getPool()
owner: agent:claude
status: active
branch: refactor/352-distinct-onto-getpool
area:
  - apps/shared/src/features/distinct/**
  - apps/api-server/src/server.ts
  - apps/api-server/src/app/app.ts
  - apps/api-server/src/features/distinct/**
  - apps/api-server-fast/src/server.ts
  - apps/api-server-fast/src/app/app.ts
  - apps/api-server-fast/src/features/distinct/**
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #352
---

## What

Standardize both api-servers on `@lcabrera/server`'s `getPool()` singleton, and
migrate the shared distinct repository onto `selectFilterOptions` so the
build→run→shape logic lives in exactly one place (the package).

- Both `server.ts`: `new Pool(...)` → `getPool()`; shutdown → `closePool()`.
- `api-shared` `createDistinctRepository` → composes `selectFilterOptions`
  (keeps `parseDistinctSource` as the schema/table+column authorization
  boundary). Drops the injected `pool` param.
- Distinct route/plugin + both `app.ts` stop threading `pool` into the distinct
  path (other features keep it).
- Tests flip from "inject a fake pool, assert SQL" to "mock `selectFilterOptions`"
  — the #351 pattern.

Out of scope (follow-up): migrating the remaining api-shared repositories
(carSales, enterpriseOrders, wideAlltypes150, dbSanity) onto package executors.

## Status / next

- Current step: implementing the api-shared repository migration.
- Blockers: none (#351 merged; `selectFilterOptions` is on main).
- Next: server.ts pool source + wiring ripple + tests + gate.
