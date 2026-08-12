---
id: grouping-walking-skeleton
title: Grouping walking skeleton on enterprise-orders
owner: agent:claude
status: review
branch: chore/568-grouping-walking-skeleton
area:
  - packages/ui/src/**
  - packages/server/src/db/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: 641
issue: #568
---

## What

Slice 1 of the row-grouping epic (#547): one route groups by one key with flat
aggregation, end to end — the loader meta flag, `isGroupable`, the `grouping`
URL codec and its sanitizer, the grouping store on the config context, the
grouped server read, the group-header row and two icons.

Out of scope and left to #569/#570: rollup and cube, multi-key grouping,
aggregate selection, expansion, the drawer section, and the result guard rails.

## Status / next

- Current step: implemented, gate green, draft PR open
- Blockers: none
- Next: review
