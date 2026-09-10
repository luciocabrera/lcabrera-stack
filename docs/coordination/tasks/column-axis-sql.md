---
id: column-axis-sql
title: emit a wide grouped read from a column axis
owner: agent:claude
status: review
branch: feat/1164-column-axis-sql
area:
  - packages/server/src/db/**
  - packages/server/src/errors/**
  - packages/server/src/INVENTORY.md
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/components/Table/utils/isTableGroupingRefusalReason.util.ts
  - docs/decisions/**
  - docs/product/requirements/**
  - reports/api-surface/**
  - .changeset/**
started: 2026-09-10
updated: 2026-09-10
plan: (none)
pr: 1165
issue: #1164
---

## What

Server-side column axis: `FILTER` aggregates per distinct value, caller-supplied
`maxDistinct`, env helper, ADR-123. Grid render is a later child of #660.

## Status / next

- Current step: addressing review comments on #1165
- Blockers: none
- Next: wait for CI after the review-fix commit
