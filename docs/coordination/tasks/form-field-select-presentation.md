---
id: form-field-select-presentation
title: Unclip the VirtualSelect dropdown and right-align the numeric/currency fields
owner: agent:second
status: active
branch: feat/480-ui-improvements
area:
  - packages/ui/src/components/VirtualSelect/**
  - packages/ui/src/components/Form/fields/**
  - packages/ui/src/components/AppDotted/**
started: 2026-08-01
updated: 2026-08-01
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/480
---

## What

Field/select half of #480. Shares `feat/480-ui-improvements` with the modal/form
layout half — see `branches/feat-480-ui-improvements.md`.

- **VirtualSelect** — the floating dropdown was `position: absolute`, so every
  clipping ancestor between it and the document cut it off (Form group card,
  the form's scroll region, a drawer). It now renders in the **top layer**
  (`popover` + `showPopover()`) with viewport coordinates measured from the
  shell's container. `isAlwaysOpen` (inline filter panels) is untouched.
- **Numeric/currency fields** — value right-aligned to match how the Table
  renders numeric cells; the currency symbol moved to trail the value rather
  than strand itself at the far edge of the box; spin buttons given room.

## Status / next

- Current step: complete and gated; committed to the shared branch.
- Blockers: none.
- Next: integrator rebases onto `main` and opens the PR covering both halves.

## Notes

Three findings worth not rediscovering:

- **The same select looks correct on the showcase page** because that page has
  no clipping ancestor — not because it is wired differently. Clipping is not a
  stacking question, so no z-index fixes it; the element has to leave the
  clipping chain entirely.
- **Popover, not a portal.** A portal moves the DOM node, and the shell's
  `useClickOutside` uses `contains()` — so the list would start counting as
  "outside" and dismiss itself on its own clicks. The top layer moves painting
  only, leaving the tree intact.
- **jsdom has partial Popover support**, which is worse than none: it applies
  the `[popover]` UA rule (`display: none` until open) but ships no
  `showPopover` to open with. Hence the `HAS_POPOVER_SUPPORT` feature detection
  — without it the list is permanently invisible under test.

Two things in this area are deliberately NOT in the commit, both flagged to the
integrator:

- `AppDotted.stylex.ts` — an uncommitted `containerName`/`containerType` pair
  this task did not author. Nothing queries `app-dotted`, and `container-type:
inline-size` makes the element a containing block for fixed-position
  descendants, which touches this task's fallback path. Needs its author.
- `pnpm-workspace.yaml` / `pnpm-lock.yaml` — a real, gated dependency-catalog
  refresh (see the branch thread), not pre-existing dirt. Belongs in its own
  `build(deps)` commit, not in a UI change.
