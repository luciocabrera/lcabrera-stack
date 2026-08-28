---
id: group-details-declared-columns-and-locked-filters
title: The group details modal opens at the declared columns and states its group
owner: agent:claude
status: review
branch: fix/1021-group-details-declared-columns-and-locked-filters
area:
  - packages/ui/src/components/Table/TableSettingsDrawer/FiltersSection/**
  - packages/ui/src/components/Table/contexts/TableConfig/columns/actions/hooks/**
  - packages/ui/src/components/Table/contexts/TableConfig/meta/selectors/**
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/routing/loaders/**
  - packages/server/src/db/olap/**
  - apps/showcase/src/routes/enterprise-orders/**
started: 2026-08-27
updated: 2026-08-28
plan: (none)
pr: 1024
issue: #1021
---

## What

The group details modal opens at the declared columns and states its group.

`@lcabrera/ui` gains two route-declared meta fields: `lockedFilters` (a
restriction the table states and cannot change, rendered as its own section of
the Filters panel) and `isColumnLayoutTransient` (the column layout is neither
restored from the persistence cookie nor written to it). `@lcabrera/server`'s
`toGroupHeading` becomes `resolveGroupRestriction`, which answers a request as a
list of restrictions and refuses one it cannot read. Recorded as
[ADR-094](../../decisions/ADR-094-a-scoped-table-states-its-restriction-and-opens-declared.md).

## Status / next

- Current step: round 7 — a synchronously throwing resolver rejects instead of stranding the other, `vp run check:safe` green
- Blockers: none
- Next: address review findings
