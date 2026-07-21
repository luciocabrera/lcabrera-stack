---
id: shared-reclaim-duplicates
title: refactor(shared): delete duplicated buildOrderByClause, adopt the hardened one
owner: agent:claude
status: active
branch: refactor/shared-reclaim-duplicates
area:
  - apps/shared/src/utils/**
  - apps/shared/src/features/**
  - apps/shared/src/types/**
  - apps/api-server/src/utils/buildOrderByClause.util.ts
  - apps/api-server-fast/src/utils/buildOrderByClause.util.ts
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #143
---

## What

`buildOrderByClause` exists twice; the copy the demo API servers use
interpolates column keys into SQL with none of the identifier guards the
`@repo/data-access` version applies. Adopt the hardened one and delete the
copy. Also dedupe `DistinctValuesResponse`.

The conditional moves (`serializeDatabaseValue`, `formatPgAdminQuery`,
envelope types) stay in `apps/shared` for now — they have no consumer
outside the demo pair, so they have not earned a package home yet.

## Status / next

- Current step: swapping the 3 repositories onto the hardened builder
- Blockers: none
- Next: quality gate + live smoke test against Postgres
