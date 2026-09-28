---
id: clear-column-layout
title: Fix the column clear and Order by Sorting in the settings drawer
owner: agent:claude
status: review
branch: fix/1185-clear-column-layout
area:
  - packages/ui/src/components/Table/TableSettingsDrawer/**
  - packages/ui/src/components/Table/ARCHITECTURE.md
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/utils/tests/drawerClearActionStores.util.ts
  - packages/ui/src/utils/tests/registerDrawerClearActionMocks.ts
  - .changeset/clear-column-layout-to-defaults.md
started: 2026-09-28
updated: 2026-09-28
plan: (none)
pr: '#1186'
issue: #1185
---

## What

The Columns tab's clear empties order, pinning and visibility instead of
restoring the applied pinning, and Order by Sorting works when no custom order
is staged.

## Status / next

- Current step: PR #1186 in review
- Blockers: none
- Next: address review threads, merge, delete this file
