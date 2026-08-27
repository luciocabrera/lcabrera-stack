---
id: align-group-row-numerics
title: Right-align numeric values on group rows
owner: agent:claude
status: active
branch: fix/1018-align-group-row-numerics
area:
  - packages/ui/src/components/Table/TableBodyCell/**
  - packages/ui/src/components/Table/TableBody/utils/**
  - packages/ui/src/components/Table/TableGroupAggregate/**
  - packages/ui/src/components/Table/TableGroupKeyCell/**
  - packages/ui/src/components/Table/Table.groupRowAlignment.test.tsx
  - .changeset/**
started: 2026-08-27
updated: 2026-08-27
plan: (none)
pr: '#1022'
issue: #1018
---

## What

Right-align numeric values on group rows

## Status / next

- Current step: implementing — cell alignment follows the column's data type on
  group rows as well as detail rows (#1018)
- Blockers: none
- Next: quality gate, then push
