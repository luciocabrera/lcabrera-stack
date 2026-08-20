---
id: ui-multi-aggregate-per-column
title: Let a column carry several aggregates
owner: agent:claude
status: review
branch: feat/831-ui-multi-aggregate-per-column
area:
  - packages/ui/src/components/Table/contexts/TableConfig/**
  - packages/ui/src/components/Table/TableSettingsDrawer/**
  - packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/**
  - packages/ui/src/components/Table/TableGroupAggregate/**
  - packages/ui/src/components/Table/commands/**
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/utils/urlState/**
  - packages/ui/src/routing/**
  - packages/ui/src/INVENTORY.md
  - packages/server/src/db/olap/decode-grouped-rows.util.test.ts
  - packages/server/src/db/group-query-builder/resolve-aggregate-alias.util.test.ts
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/routes/wide-alltypes-150/**
  - docs/decisions/ADR-061*
  - docs/decisions/ADR-086*
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/838
issue: #831
---

## What

Widen `TableGroupingState.aggregates` from a column-to-function map to an ordered
list of `(columnKey, fn)` records, so a column may carry several aggregates at
once, and migrate `shares` to the same per-aggregate identity. The `grouping` URL
param carries both as ordered arrays of `"<columnKey>:<fn>"` tokens.

The `area` list is wider than the claim opened with: the type change reaches the
grouped services in `apps/react-router`, `Table/commands` (the aggregates' own
command derivation), `Table/utils` (the token module) and the two
`@lcabrera/server` tests pinning the distinct-alias property the UI now leans on.

## Status / next

- Current step: implemented, full gate green, in review
- Blockers: none
- Next: verification
