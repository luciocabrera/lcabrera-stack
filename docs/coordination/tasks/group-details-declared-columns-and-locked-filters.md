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
updated: 2026-08-27
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
`toGroupHeading` becomes `toGroupRestrictions`, answering the same parse as a
list so a panel and a title cannot name different groups. The showcase's
group-details route declares both.

## Status / next

- Current step: implemented; `vp run check:safe` green, PR readied for review
- Blockers: none
- Next: address review findings
