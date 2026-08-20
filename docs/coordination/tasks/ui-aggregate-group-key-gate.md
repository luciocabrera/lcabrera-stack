---
id: ui-aggregate-group-key-gate
title: Stop offering aggregation on a column that is a group key
owner: agent:claude
status: active
branch: fix/830-ui-aggregate-group-key-gate
area:
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/**
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/commands/ARCHITECTURE.md
  - packages/ui/src/INVENTORY.md
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: '#834'
issue: #830
---

## What

Stop offering aggregation on a column that is a group key

## Status / next

- Current step: implemented — one predicate (`resolveOfferableAggregates`) behind
  the header menu's aggregation block and the drawer's "Add Aggregate" picker
- Blockers: none
- Next: quality gate, then review
