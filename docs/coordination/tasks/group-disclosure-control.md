---
id: group-disclosure-control
title: A grouped row can be expanded with a pointer, not only with the keyboard
owner: agent:claude
status: review
branch: feat/771-group-disclosure-control
area:
  - packages/ui/src/components/Table/TableGroupDisclosure/**
  - packages/ui/src/components/Icons/DisclosureIcon/**
started: 2026-08-18
updated: 2026-08-18
plan: (none)
pr: (none)
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
- Blockers: stacked on `feat/765-group-row-register` (#766), which is green but
  unmerged; this branch targets it rather than `main` so the diff stays readable.
  The `TableGroupLabel` edits here are one line each and deliberately serialised
  behind that claim rather than listed as an area this work owns — two claims
  naming the same glob on two branches is the collision the register exists to
  surface, and stacking is how this one is resolved.
- Next: quality gate, then retarget to `main` once #766 lands
