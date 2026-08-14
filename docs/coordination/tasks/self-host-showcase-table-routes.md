---
id: self-host-showcase-table-routes
title: Self-host the car-sales and wide-alltypes routes
owner: agent:claude
status: review
branch: refactor/687-self-host-showcase-table-routes
area:
  - apps/react-router/src/routes/car-sales/**
  - apps/react-router/src/routes/car-sales-infinite/**
  - apps/react-router/src/routes/wide-alltypes-150/**
  - apps/react-router/src/routes/api/car-sales-paginated/**
  - apps/react-router/src/routes/api/wide-alltypes-150-paginated/**
  - apps/react-router/src/services/**
  - apps/react-router/docs/**
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/701
issue: #687
---

## What

Every table route in `apps/react-router` serves its own rows from Postgres —
`car-sales`, `car-sales-infinite` and `wide-alltypes-150` adopt the shape
`enterprise-orders` already had (entity `config/`, a `.server` service, an
`_api/…/paginated` resource route). `VITE_API_URL` stays as an opt-in override.

## Status / next

- Current step: implemented, gate green, PR ready for review
- Blockers: none
- Next: verification

## Coordination note

The `routes/api/**` glob was narrowed after the claim to the two resource-route
folders this work actually adds. `routes/api/filter-options/` is **not** touched
here — PR #703 (issue #688) rewrites that file, and the two changes do not meet.
The only shared file is `routes/car-sales/config/index.ts`, which this work adds
exports to without changing the three `#703` reads.
