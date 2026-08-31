---
id: grouping-menu-drag-and-share-fixes
title: Polish the grouping menu, keep a column's aggregates contiguous, and fix the function picker and share
owner: agent:claude
status: review
branch: fix/1050-grouping-menu-drag-and-share-fixes
area:
  - packages/ui/src/components/Table/TableHeaderCell/**
  - packages/ui/src/components/Table/commands/grouping/**
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/TableGroupAggregate/**
  - packages/ui/src/components/Table/contexts/TableConfig/grouping/**
  - packages/ui/src/components/DraggableList/**
started: 2026-08-31
updated: 2026-08-31
plan: (none)
pr: #1051
issue: #1050
---

## What

Polish the grouping menu, keep a column's aggregates contiguous, and fix the function picker and share

## Status / next

- Current step: in review — all six reported items are implemented, `vp run
check:safe` is green (77 tasks), and #1051 is out of draft.
- Blockers: none. Two things need a person at a running app, because jsdom
  computes no layout: the share bar's fill sizing, and the drag refusal that
  keeps a column's aggregates contiguous.
- Next: address review threads, then merge. **Merge this before #1053** — that
  branch also adds rows to `packages/ui/src/INVENTORY.md` and a changeset, so
  whichever lands second rebases.
