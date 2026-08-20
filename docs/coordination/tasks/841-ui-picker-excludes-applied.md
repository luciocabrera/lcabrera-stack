---
id: 841-ui-picker-excludes-applied
title: Stop offering a function the column already carries
owner: agent:claude
status: active
branch: fix/841-841-ui-picker-excludes-applied
area:
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/Table/commands/ARCHITECTURE.md
  - packages/ui/src/INVENTORY.md
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: #846
issue: #841
---

## What

Stop offering a function the column already carries.

The drawer's Add Aggregate function picker offered a function the chosen column
already carried; #831 made the write an append with a duplicate guard, so
picking it was accepted and then did nothing visible. The subtraction lives in a
new `resolveAddableAggregates`, beside the shared `resolveOfferableAggregates`
rather than inside it, because the column header menu must keep offering an
applied function as its toggle-off.

## Status / next

- Current step: implemented, gate run, in review
- Blockers: none
- Next: merge
