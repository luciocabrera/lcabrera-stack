---
id: ui-table-source-by-name
title: Drive a grid from a schema and table name
owner: agent:claude
status: review
branch: feat/996-ui-table-source-by-name
area:
  - packages/server/src/table-page/**
  - packages/server/README.md
  - packages/server/src/INVENTORY.md
  - packages/server/package.json
  - packages/ui/src/routing/**
  - packages/ui/src/hooks/useTableRoutePage*
  - packages/ui/src/components/TableRouteView/**
  - packages/ui/README.md
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - packages/ui/src/components/Table/Table.types.ts
  - apps/showcase/src/INVENTORY.md
  - apps/showcase/src/services/serveTablePageRequest*
  - .changeset/grid-source-by-table-name.md
  - apps/showcase/src/routes/enterprise-orders/**
  - apps/showcase/src/routes/api/**
  - apps/showcase/src/routes/car-sales/**
  - apps/showcase/src/routes/wide-alltypes-150/**
  - reports/api-surface/ui.txt
  - reports/api-surface/server.txt
  - docs/decisions/ADR-144-*
  - docs/product/requirements/connect-a-grid-to-a-table-by-name.md
started: 2026-10-27
updated: 2026-10-27
plan: (none)
pr: '#1522'
issue: #996
---

## What

Drive a grid from a schema and table name

## Status / next

- Current step: gate green, PR ready for review
- Blockers: none
- Next: review
