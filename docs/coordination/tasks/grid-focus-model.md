---
id: grid-focus-model
title: Grid focus model — roles, roving tabindex and keyboard navigation
owner: agent:claude
status: review
branch: feat/560-grid-focus-model
area:
  - packages/ui/src/components/Table/TableBase/**
  - packages/ui/src/components/Table/TableBody/**
  - packages/ui/src/components/Table/TableBodyRows/**
  - packages/ui/src/components/Table/TableBodyCell/**
  - packages/ui/src/components/Table/TableRow/**
  - packages/ui/src/components/Table/TableContent/**
  - packages/ui/src/components/Table/SpacerRow/**
  - packages/ui/src/components/Table/hooks/**
  - packages/ui/src/components/Table/contexts/TableFocus/**
started: 2026-08-12
updated: 2026-08-13
plan: (none)
pr: #645
issue: #560
---

## What

Grid focus model — roles, roving tabindex and keyboard navigation (ADR-062).

## Status / next

- Current step: implemented, full gate green, awaiting verification
- Blockers: none
- Next: verifier round on #645

## Notes for anyone working nearby

Three edits land **outside** the area globs above, each as small as the change
allows, because the attribute they add has no other home:

- `TableHeaderCell/` — `role='columnheader'`, `scope='col'` and `aria-sort`,
  plus a `resolveAriaSort` util. `ResizeHandle` drops from `tabIndex={0}` to
  `-1`, since a grid has exactly one roving tab stop.
- `TableHeader/` — `aria-rowindex={1}` on the header row.
- `TableGroupHeaderRow/` — forwards native `<tr>` attributes so a group row can
  carry the same `aria-rowindex` every other body row does.

The focus store lives in its own context (`contexts/TableFocus/`), deliberately
not as a fourth slice of `TableConfig`, so it does not collide with grouping
work in that directory.
