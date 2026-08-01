---
id: interactive-card-surface-recipe
title: Shared interactiveCard surface recipe for radio option cards
owner: agent:claude
status: active
branch: feat/484-interactive-card-surface-recipe
area:
  - packages/ui/src/components/RadioOptionGroup/**
  - packages/ui/src/components/DraggableList/**
  - packages/ui/src/components/Table/TableSettingsDrawer/FiltersSection/ActiveFiltersList/FilterItem/**
  - packages/ui/src/design-system/tokens/surfaces.stylex.ts
started: 2026-08-01
updated: 2026-08-01
plan: (none)
pr: (none)
issue: #484
---

## What

Give the radio option cards (Pin Column modal and every other `RadioOptionGroup`
site) the same surface as the settings drawer's draggable rows — translucent
fill, hover lift, border — and add the keyboard focus ring the radio input lost
to `appearance: none`.

That surface already existed verbatim in `DraggableListItem` and `FilterItem`, so
it is extracted to a shared `surfaceStyles.interactiveCard` recipe in the
existing `surfaces.stylex.ts` and adopted by all three, rather than copied a
third time.

## Known overlap

`packages/ui/src/design-system/tokens/surfaces.stylex.ts` is also claimed by
**table-actions-menu-surface-dividers** (#482), which is adding a `glassPanel`
recipe to the same file. Accepted rather than serialized: both changes append a
distinct key to one `stylex.create` call, touch no shared line, and carry no
shared semantics. Whoever merges second resolves a few lines. Neither task
touches the other's components.

## Status / next

- Current step: implemented; quality gate
- Blockers: none
- Next: gate → PR ready for review
