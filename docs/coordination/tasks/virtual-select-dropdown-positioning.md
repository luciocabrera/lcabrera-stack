---
id: virtual-select-dropdown-positioning
title: VirtualSelect dropdown mispositions in the column drawer and closes on list scroll
owner: agent:claude
status: review
branch: fix/488-virtual-select-dropdown-positioning
area:
  - packages/ui/src/components/VirtualSelect/**
  - packages/ui/src/components/VirtualList/VirtualListBody/**
  - packages/ui/src/components/Table/filters/FilterInputs/**
started: 2026-08-02
updated: 2026-08-02
plan: (none)
pr: #489
issue: #488
---

## What

Two defects in the `VirtualSelect` dropdown, both fallout from the move to the
native Popover API (top layer + `position: fixed`):

1. In the Column Settings drawer's Filter tab, `OperatorSelect` passed a
   `customStylex` override resetting `position`/`left`/`top`. It was applied
   last in the dropdown's style chain, so it beat the computed placement, and a
   non-positioned top-layer box lays out against the viewport origin. Fixed by
   deleting the override and composing `customStylex` **before** the positioning
   styles, so a consumer style can never move the list.
2. The close-on-scroll listener was a `capture: true` `scroll` handler on
   `window` with no `event.target` guard, so the dropdown's own option list
   dismissed it. Fixed by ignoring scrolls originating inside the dropdown,
   adding `overscroll-behavior: contain` so reaching the end of the list does
   not chain-scroll the drawer, and dismissing via a close action rather than a
   toggle (a toggle no-ops while `isBusy`).

An ancestor scroll still dismisses — that stays the documented decision.

## Status / next

- Current step: implemented; full gate green (fmt, oxlint, eslint, Biome, React
  Doctor, tsgolint, tsc, 2309 tests, fallow, api-surface, attw)
- Blockers: none
- Next: PR #489 ready for review
