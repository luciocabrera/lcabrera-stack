---
id: grouping-refusal-surface
title: Render a server-refused group key instead of emptying the table
owner: agent:claude
status: review
branch: chore/642-grouping-refusal-surface
area:
  - packages/ui/src/components/Table/Table.component.tsx
  - packages/ui/src/components/Table/Table.constants.ts
  - packages/ui/src/components/Table/Table.test.tsx
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/components/Table/TableEmptyState/**
  - packages/ui/src/components/Table/TableLayout/**
  - packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/GroupActions/**
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/commands/ARCHITECTURE.md
  - packages/ui/src/components/Table/contexts/TableData/**
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/TableRouteView/**
  - packages/ui/src/types/ui.types.ts
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: #662
issue: #642
---

## What

Render a server-refused group key instead of emptying the table.

Two halves, because either alone leaves the defect reachable. A refused read now
travels as data on `TablePageResponse.error` and the table's empty body renders
it — the refused column under its header label, the endpoint's own reason, and
**Clear grouping** in place of a Retry that would be refused again. And every
grouping affordance narrows the declared `isGroupable` with the catalogue's
answer through `resolveGroupKeyAvailability`, so a key the endpoint refuses is no
longer offered.

## Status / next

- Current step: implemented, full gate green, in review
- Blockers: none
- Next: PR #662 out of draft
