---
id: table-actions-menu-surface-dividers
title: Table actions menu — drawer-matching glass surface + symmetric section dividers
owner: agent:claude
status: active
branch: fix/482-table-actions-menu-surface-dividers
area:
  - packages/ui/src/components/Table/TableActionsPopover/**
  - packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/**
  - packages/ui/src/components/Table/TableRowActionsMenu/**
  - packages/ui/src/components/SidePanel/**
  - packages/ui/src/design-system/tokens/surfaces.stylex.ts
started: 2026-08-01
updated: 2026-08-01
plan: ~/.claude/plans/let-s-make-the-menu-wobbly-engelbart.md
pr: '#483'
issue: #482
---

## What

Both menus built on `TableActionsPopover` (column header, row ⋮) drop their
hardcoded opaque panel for the shared `surfaceStyles.glassPanel` recipe, so they
read as the same material as the settings drawer — which now composes that same
recipe instead of inlining it. Section rules become standalone
`TableActionsPopoverSeparator` elements, so the menu's own flex `gap` spaces them
equally above and below instead of 8px above and nothing below.

## Status / next

- Current step: implemented; full gate green (fmt, oxlint, eslint, biome, react
  doctor, `vp check`, `typecheck:all`, `test:ci`)
- Blockers: none
- Overlap: `interactive-card-surface-recipe` (#484) also claims
  `design-system/tokens/surfaces.stylex.ts` — both add a distinct key to the same
  `stylex.create` object, so expect a textual merge conflict there and nothing
  semantic. Whichever lands second keeps both keys.
- Next: visual confirmation in the showcase app, then flip PR #483 out of draft
