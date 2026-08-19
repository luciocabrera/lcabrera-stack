---
id: fold-group-from-first-row
title: Fold a group from its first row, not its subtotal
owner: agent:claude
status: review
branch: feat/802-fold-group-from-first-row
area:
  - packages/ui/src/components/Table/contexts/TableConfig/expansion/**
  - packages/ui/src/components/Table/TableGroupKeyCell/**
  - packages/ui/src/components/Table/TableGroupDisclosure/**
  - packages/ui/src/components/Table/contexts/TableFocus/**
  - docs/decisions/ADR-080*
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: 809
issue: #802
---

## What

Move a group's fold control off the subtotal that ends its block and onto the
cell where that level's key is drawn, so the control sits where the reader is
looking. Amends ADR-080, which moved the key's identity into its own column and
left the control behind.

## Status / next

- Current step: implemented, full quality gate green, PR #809 open for review
- Blockers: none
- Next: address review, then merge
