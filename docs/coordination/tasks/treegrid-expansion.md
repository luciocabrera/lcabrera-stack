---
id: treegrid-expansion
title: Path-keyed expansion and treegrid semantics
owner: agent:claude
status: review
branch: chore/571-treegrid-expansion
area:
  - packages/ui/src/components/Table/contexts/**
  - packages/ui/src/components/Table/hooks/**
  - packages/ui/src/components/Table/TableBodyRows/**
  - packages/ui/src/components/Table/TableBase/**
  - packages/ui/src/components/Table/TableBody/**
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/components/Table/Table.groupedGridSemantics.test.tsx
  - packages/ui/src/components/Table/Table.treeExpansion.test.tsx
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: '#665'
issue: #571
---

## What

Path-keyed expansion and treegrid semantics for a grouped Table (#571): a fourth
config store holding the collapsed group paths, the derived visible-row set every
count comes off, `role="treegrid"` with per-row level/position/set-size,
`ArrowRight`/`ArrowLeft` expansion keys, and focus recovery to the collapsed
group row. Recorded as ADR-067.

## Status / next

- Current step: built, gate green, pushed; PR left as a draft for review
- Blockers: none
- Next: verification

## Overlaps, declared

Two other live claims cover part of this area and **neither has written any code
yet** (both branches carry only their claim commit):

- `rollup-subtotals` (#570) claims `contexts/**`, `TableRow/**`, `utils/**`,
  `TableGroupHeaderRow/**`, `TableBody/**`. Nothing here touches
  `TableGroupHeaderRow/` or `TableRow/`. `TableBody.component.tsx` is touched in
  one place — the virtualization window counts visible rows rather than loaded
  ones, which is what keeps the height invariant true while a group is collapsed
  — plus the matching mock in its test.
- `grouping-refusal-surface` (#642) claims all of
  `packages/ui/src/components/Table/**`.
