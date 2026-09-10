---
id: pinned-cell-opacity
title: fix(ui): pinned cells are translucent, so scrolled columns show through
owner: agent:claude
status: active
branch: fix/1166-pinned-cell-opacity
area:
  - packages/ui/src/components/Table/TableBodyCell/TableBodyCell.stylex.ts
  - packages/ui/src/components/Table/Table.cellRigidity.test.ts
  - .changeset/pinned-cells-stay-opaque.md
started: 2026-09-10
updated: 2026-09-10
plan: (none)
pr: (none)
issue: #1166
---

## What

Restores the explicit opaque background on a pinned body cell, which #1158
replaced with `inherit`.

## Why

`surfacePrimary` carries alpha in both themes, and it is the token an ordinary
row paints. A pinned cell inheriting it is see-through, so the columns scrolling
underneath it are legible on top of it.

## Note on overlap

`packages/ui/src/components/Table/**` is inside the area
`refactor/1141-split-table-meta-state` (#1151) claims. This touches one style
file and one test and does not move any state, so it is narrow by construction;
whichever lands second rebases.
