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

Two changes outside the field/select work ride along on this branch, each in
its own commit so they can be reviewed or dropped independently:

- `AppDotted.stylex.ts` — authored by human:lucio, committed here at their
  request. It makes the dotted surface a query container. Nothing queries
  `app-dotted` yet, and `container-type: inline-size` implies layout
  containment, so the element becomes a containing block for fixed-position
  descendants. Top-layer content is unaffected, so the dropdown above still
  resolves against the viewport; only its no-popover fallback would offset.
- `pnpm-workspace.yaml` / `pnpm-lock.yaml` — a dependency-catalog refresh
  (5 packages, TypeScript held). The content half of `vp run deps:refresh`;
  that command's own ceremony would have forked a second issue and branch.
  `vp upgrade` and `pnpm clean --lockfile` were skipped, so the
  stale-resolution sweep is still outstanding.
