---
id: distinct-values-executor
title: Reusable distinct-values executor with type-driven predicate
owner: agent:claude
status: review
branch: feat/348-distinct-values-executor
area:
  - packages/server/src/db/**
  - apps/react-router/src/routes/api/filter-options/**
  - apps/react-router/src/routes/enterprise-orders/config/**
  - apps/react-router/src/routes/car-sales/config/**
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: 351
issue: #348
---

## What

Complete and generalize the #340/#341 filter-options work, which landed on main
with only the same-origin `transport: 'loader'` change — the loader still proxied
to the api-server, so filter options still needed it running.

- Add `@lcabrera/server`'s `selectDistinctValues` executor (the execute half of
  `buildDistinctQuery`) + a pure, type-driven `buildDistinctValuePredicate`
  (`DistinctQueryDescriptor.columnType`).
- Rewire `/_api/filter-options` to read Postgres directly via the executor, and
  derive its allow-list + column types from per-entity `config/` (no duplicated
  allow-list). New client-safe car-sales config.

## Status / next

- Current step: reconstructed onto current main (post vite-plus/test migration);
  full gate green; live-verified with the api-server down.
- Blockers: none
- Next: open PR against #348; merge.
- Follow-ups: api-server/Fastify dedup onto `selectDistinctValues` (#352);
  unified per-entity column-metadata source.
