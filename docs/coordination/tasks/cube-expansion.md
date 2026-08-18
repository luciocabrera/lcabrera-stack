---
id: cube-expansion
title: Cube expansion at depth three
owner: agent:claude
status: review
branch: chore/574-cube-expansion
area:
  - packages/server/src/db/group-query-builder/**
  - packages/server/src/db/select-grouped-rows.util.ts
  - apps/react-router/src/.server/cubeExpansion.smoke.test.ts
  - apps/react-router/src/routes/enterprise-orders/.server/enterpriseOrders.smoke.test.ts
started: 2026-08-18
updated: 2026-08-18
plan: (none)
pr: '#780'
issue: #574
---

## What

`GROUP BY CUBE` as a third grouping mode, capped at depth three, emitted as
explicit grouping sets like the other two (ADR-059).

The one new file in an app is the smoke test: `@lcabrera/server`'s own suite is
DB-free (ADR-032), and the claim that our expansion _is_ what `CUBE (…)` means
is a statement about Postgres, so only a live comparison can settle it.

## Status / next

- Current step: implementation, both test lanes, docs and changeset done; gate green
- Blockers: none
- Next: review on PR #780
