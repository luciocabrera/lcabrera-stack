---
id: 832-ui-reorderable-aggregates
title: Make the staged aggregate list reorderable
owner: agent:claude
status: review
branch: feat/832-832-ui-reorderable-aggregates
area:
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/TableSettingsDrawer/TableDrawerContext/actions/**
  - packages/ui/src/components/Table/TableSettingsDrawer/ARCHITECTURE.md
  - packages/ui/src/components/Table/contexts/TableConfig/grouping/actions/utils/**
  - packages/ui/src/components/DraggableList/ARCHITECTURE.md
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/stylex-module-paths.test.json
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: #843
issue: #832
---

## What

Render the settings drawer's staged aggregates through `DraggableList`, so the
order the `grouping` param already carries is one a user can arrange. Adds
`AggregateItemContent` as the row, `reorderTableColumnAggregates` as the pure
permutation, and `useReorderColumnAggregates` as the staged write.

## Status / next

- Current step: implemented, gate run, PR open for review
- Blockers: none
- Next: address review findings, then close on merge
