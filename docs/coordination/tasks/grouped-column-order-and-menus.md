---
id: grouped-column-order-and-menus
title: Paint measures in the staged aggregate order and refuse the layout actions a grouped column cannot take
owner: agent:claude
status: review
branch: feat/1048-grouped-column-order-and-menus
area:
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/Table/hooks/**
  - packages/ui/src/components/Table/commands/grouping/**
  - packages/ui/src/components/Table/TableHeaderCell/**
  - packages/ui/src/components/Table/Table.constants.ts
  - packages/ui/src/components/Table/Table.aggregateColumns.test.tsx
started: 2026-08-31
updated: 2026-08-31
plan: ~/.claude/plans/see-the-images-1-robust-lerdorf.md
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1049
issue: #1048
---

## What

Two fixes to the grouped Table, both reported from the running app.

1. **Measure columns paint in the declared column order, not the order the
   aggregate list was staged in.** `withAggregateColumns` splices each measure
   into the slot of the column it measures, so `Count of Order #` paints before
   `Total Amount`'s four measures even though it is last in the list. A fourth
   derivation step orders the measure run by the staged list, ranking each source
   by its first entry so a column's measures stay contiguous — the header band
   only spans neighbours.
2. **The header menu offers layout actions that cannot take effect.** A group key
   is force-left-pinned and force-unhidden on every derivation, so Pin/Hide on one
   is discarded by the next; a measure's pinning routes to its source column and
   expands back into all of that column's measures. Both are disabled, and a
   `Remove from Grouping` item drops one key without clearing the rest.

## Coordination

`chore/1028-no-comment-rule` (active, agent:claude) claims
`packages/ui/src/**`, which contains every path this task owns. The areas above
are deliberately narrowed to the files this work actually edits. The two are
separable in kind — that task removes comment prose, this one adds code and
tests — so the expected conflict surface is comment blocks inside the Table
files listed above. Whichever lands second rebases.

## Status / next

- Current step: both parts implemented, documented and gated; PR #1049 out of draft
- Blockers: none
- Next: review
