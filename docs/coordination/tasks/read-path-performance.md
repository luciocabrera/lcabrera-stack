---
id: read-path-performance
title: Read-path performance — parallel count, count-once, keyset pagination, list projection
owner: agent:claude
status: review
branch: perf/391-read-path-performance
area:
  - packages/server/src/db/query-builder/**
  - packages/ui/src/components/Table/utils/resolveFetchMoreState.util.ts
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/routes/api/enterprise-orders-paginated/**
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: 429
issue: 391
---

## What

Epic #391 (E-3) in one PR — every child of the read-path performance epic:

- **#401 (P1)** — `selectOrdersPage` runs its page query and its count query
  concurrently instead of sequentially.
- **#402 (P2)** — the `COUNT` runs only on the first page of a scroll session;
  the client keeps the total it already has.
- **#403** — the `keyset-pagination` ADR draft promoted into `docs/decisions/`.
- **#404 (P3)** — opt-in keyset (`cursor`) pagination in the `@lcabrera/server`
  query builder, wired into the paginated resource route; `OFFSET` stays the
  default for jump-to-page reads.
- **#405 (P4)** — a `ENTERPRISE_ORDER_LIST_COLUMNS` read model so the list query
  stops shipping every column of the row.

## Status / next

- Current step: in review (PR #429)
- Blockers: none
- Next: address review, then merge and delete this file
