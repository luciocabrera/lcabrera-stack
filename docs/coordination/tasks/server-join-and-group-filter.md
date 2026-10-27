---
id: server-join-and-group-filter
title: Join along a foreign key and filter a flat grouped read
owner: agent:claude
status: review
branch: feat/998-server-join-and-group-filter
area:
  - packages/server/src/db/**
  - packages/server/src/INVENTORY.md
  - packages/server/README.md
  - docs/decisions/ADR-143-*.md
  - docs/product/requirements/express-a-join-and-an-aggregate-filter.md
  - docs/product/requirements/sql-is-injection-safe-by-construction.md
  - packages/server/package.json
  - .changeset/server-join-and-group-filter.md
  - reports/api-surface/server.txt
  - reports/api-surface/ui.txt
  - packages/server/src/errors/**
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/components/Table/utils/refusal.constants.ts
  - .changeset/ui-join-and-group-filter-refusals.md
started: 2026-10-27
updated: 2026-10-27
plan: (none)
pr: '#1530'
issue: #998
---

## What

Join along a foreign key and filter a flat grouped read

## Status / next

- Current step: built and gated; PR open for review
- Blockers: none
- Next: review
