---
id: table-grouping-and-panel-ux
title: Table grouping, settings tabs and resizable side panel
owner: agent:claude
status: review
branch: feat/1113-table-grouping-and-panel-ux
area:
  - packages/ui/src/components/Table/**
  - packages/ui/src/components/SidePanel/**
  - packages/ui/src/components/Tabs/**
started: 2026-09-08
updated: 2026-09-08
plan: (none)
pr: #1114
issue: #1113
---

## What

Seven changes to the table settings surfaces and the grouped grid, reported from
use:

- the row-actions column is dropped while a grouping is applied (ADR-112)
- both settings drawers order their tabs General, Columns, Filters, Sorting,
  Grouping, Details, and the reader can drag that order (ADR-114)
- a grouped grid's columns are sized from a build-declared band, which is what
  makes a measure resizable at all (ADR-113)
- totals position moves from the Grouping tab to the General tab
- the tab strip's scroll buttons no longer take focus inside an `aria-hidden`
  subtree
- the settings panel resizes from its inner edge, within 320px–90vw, persisted

## Status / next

- Current step: implemented, gates green, in review on #1114
- Blockers: none
- Next: address review, then merge
