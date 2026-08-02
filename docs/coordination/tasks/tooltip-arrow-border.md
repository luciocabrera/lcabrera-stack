---
id: tooltip-arrow-border
title: Tooltip arrow is missing the surface border
owner: agent:claude
status: active
branch: fix/486-tooltip-arrow-border
area:
  - packages/ui/src/components/Tooltip/**
started: 2026-08-01
updated: 2026-08-01
plan: (none)
pr: (none)
issue: #486
---

## What

The tooltip arrow renders as a bare filled square: the surface's 1px
`borderPrimary` outline stops at the tooltip box, so the tip below it reads as a
detached triangle. Border the two edges of the rotated square that end up
outside the body, per placement.

Also clears the two task files whose work has already merged
(`interactive-card-surface-recipe` #485, `table-actions-menu-surface-dividers`
#483) — `coordination:verify` was warning on both.

## Status / next

- Current step: implemented; quality gate
- Blockers: none
- Next: gate → PR ready for review
