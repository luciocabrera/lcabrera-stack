---
id: group-disclosure-control
title: A grouped row can be expanded with a pointer, not only with the keyboard
owner: agent:claude
status: review
branch: feat/771-disclosure-on-main
area:
  - packages/ui/src/components/Table/TableGroupDisclosure/**
  - packages/ui/src/components/Icons/DisclosureIcon/**
started: 2026-08-18
updated: 2026-08-18
plan: (none)
pr: '#773'
issue: #771
---

## What

Give the hierarchy cell a pointer affordance for the expansion that #571 already
built.

The constraint that shapes it is ADR-062's roving tabindex: exactly one element
in the grid is tabbable, so the control is click-only and outside the tab order,
and `aria-expanded` on the row stays the single announced source of the state.

## Status / next

- Current step: in review
- Blockers: none. Was stacked on #766, which merged mid-flight; rebuilt on
  `main` by cherry-pick and re-gated there.
- Next: review. Expand-all / collapse-all is deliberately not in this PR —
  see its Known Limitations, and #774.
