---
id: modal-form-layout
title: Pin the Form footer, give the chain one scroll owner, match the drawer footer
owner: agent:claude
status: active
branch: feat/480-ui-improvements
area:
  - packages/ui/src/components/Modal/**
  - packages/ui/src/components/Form/FormBody/**
  - packages/ui/src/components/Form/FormFields/**
  - packages/ui/src/components/Form/FormFooter/**
  - apps/react-router/src/routes/enterprise-orders/OrderFormModal/**
started: 2026-08-01
updated: 2026-08-01
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/480
---

## What

Layout half of #480. The Form's footer lives inside the `<form>` element, so it
can only stay pinned if the scrolling happens below the Modal body rather than at
it. That moved the scroll boundary onto the fields region, which then exposed two
follow-on problems: scrollbar appearance resized the fields, and once every
container reserved a gutter the reservations stacked (three scrollers, one ever
used).

Shares `feat/480-ui-improvements` with a second agent working on VirtualSelect,
the numeric/currency fields and AppDotted — see
`branches/feat-480-ui-improvements.md`.

## Status / next

- Current step: layout work complete and gated; committed to the shared branch.
- Blockers: none.
- Next: second agent commits their sub-area; then integrator rebases onto `main`
  and opens the PR covering both halves.

## Notes

Two findings worth not rediscovering:

- StyleX 0.19 resolves shorthand vs longhand by **priority, not application
  order** (`property-priorities.js`: `padding` 1000, `padding-inline` 2000), so a
  longhand consumer override wins regardless of composition order.
- `scrollbar-gutter` reserves its space whether or not a bar ever appears, so
  nested scroll containers stack their reservations. `hasScrollOwningChild.util`
  keeps the Form to one scroller; `bodyStylex` lets the host drop the Modal
  body's.
