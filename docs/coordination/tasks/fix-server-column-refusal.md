---
id: fix-server-column-refusal
title: Refuse a column outside allowedColumns with a typed error
owner: agent:claude
status: review
branch: fix/1524-fix-server-column-refusal
area:
  - packages/server/src/errors/**
  - packages/server/src/db/query-builder/assert-*.util*.ts
  - packages/server/src/db/query-builder/ARCHITECTURE.md
  - packages/server/src/table-page/create-table-page-loader.http.test.ts
  - packages/server/src/INVENTORY.md
  - packages/server/README.md
  - packages/server/package.json
  - .changeset/server-query-refused-error.md
  - .changeset/ui-query-refused-response-error.md
  - docs/decisions/ADR-145-*.md
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/components/Table/utils/*Refus*.ts
  - packages/ui/src/components/Table/utils/toTableResponseError.util*.ts
  - packages/ui/src/INVENTORY.md
  - apps/showcase/src/routes/enterprise-orders/.server/groupingContract.test.ts
  - reports/api-surface/**
started: 2026-10-27
updated: 2026-10-27
plan: (none)
pr: '#1527'
issue: #1524
---

## What

Refuse a column outside allowedColumns with a typed error

## Status / next

- Current step: built, gate green, PR ready for review
- Blockers: none
- Next:
