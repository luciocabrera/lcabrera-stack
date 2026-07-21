---
id: domain-types-constants-rename
title: fix(packages): complete the domain-consistent types/constants rename
owner: agent:claude
status: active
branch: fix/domain-types-constants-rename
area:
  - packages/utils/src/formatters/**
  - packages/utils/package.json
  - packages/data-access/package.json
  - packages/data-access/src/api/**
  - packages/data-access/src/db/queryBuilder/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #142
---

## What

Finish the in-flight rename toward domain-consistent `<domain>.types.ts` /
`<domain>.constants.ts` naming. The file moves landed without their export-map
and consumer updates, so `vp run typecheck:all` is currently failing on `main`.

- `@repo/utils/formatters/format.types` → `formatters.types`
- `@repo/data-access/db/queryBuilder/QueryBuilder.types` → `queryBuilder.types`
- `src/api.types.ts` / `src/api.constants.ts` → `src/api/`

First PR under epic #140.

## Status / next

- Current step: fixing export maps + consumers
- Blockers: none
- Next: docs sweep, improvement sweep, quality gate
