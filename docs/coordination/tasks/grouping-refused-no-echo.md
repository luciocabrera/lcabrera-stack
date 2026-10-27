---
id: grouping-refused-no-echo
title: Stop a refused grouped read from echoing the column name
owner: agent:claude
status: review
branch: fix/1532-grouping-refused-no-echo
area:
  - packages/server/src/errors/**
  - packages/ui/src/components/Table/utils/readRefusedError*
  - packages/ui/src/components/Table/TableEmptyState/**
  - docs/decisions/ADR-145-*
  - .changeset/server-grouping-refused-*
  - packages/server/README.md
  - packages/server/src/db/group-query-builder/assert-group-column.util.test.ts
started: 2026-10-27
updated: 2026-10-27
plan: (none)
pr: '#1539'
issue: #1532
---

## What

Stop a refused grouped read from echoing the column name

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
