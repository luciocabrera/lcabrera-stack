---
id: ui-provisional-suppressions
title: Settle the five provisional suppressions in packages/ui
owner: agent:claude
status: review
branch: refactor/311-ui-provisional-suppressions
area:
  - packages/ui/src/components/Table/SpacerRow/**
  - packages/ui/src/components/Tooltip/TooltipTrigger/**
  - packages/ui/src/components/Table/filters/NumberFilterInput/**
  - packages/ui/src/components/Table/TableHeaderCell/**
  - packages/ui/src/components/Table/TableSettingsDrawer/FiltersSection/**
  - docs/agents/public-package-suppressions.json
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: '#509'
issue: #311
---

## What

Settle the five provisional suppressions in packages/ui

## Status / next

- Current step: PASSED independent verification (#507 contract); PR #509 ready for review
- Blockers: none
- Next: review, then delete this file when #509 merges

Outcome: all five are removed rather than converted. Both bare `NOSONAR`
directives suppressed nothing — SonarCloud holds a recorded issue on each
annotated line, which a working directive would have prevented. The three
`@ts-expect-error` cases split two ways: the number-filter pair asserted a state
the type already admits (`value: undefined`), while `getPinnedStyle`'s asserted
a `PinnedColumnInfo` carrying no `side`, which nothing can construct.

Coordination note: `Tooltip/TooltipContent/**` and `Tooltip/ARCHITECTURE.md`
belong to `tooltip-arrow-border` and were not touched — the only Tooltip edit is
in `Tooltip/TooltipTrigger/TooltipTrigger.component.tsx`.
