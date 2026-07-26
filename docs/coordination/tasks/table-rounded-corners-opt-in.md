---
id: table-rounded-corners-opt-in
title: Make the Table's rounded corners opt-in via an isRounded flag
owner: agent:claude
status: review
branch: feat/444-table-rounded-corners-opt-in
area:
  - packages/ui/src/components/Table/**
started: 2026-07-26
updated: 2026-07-26
plan: (none)
pr: '#445'
issue: #444
---

## What

The Table's outer card always applied `borderRadius.lg`. It now renders square by
default and the rounded look is opt-in behind a new `isRounded` meta flag,
alongside `isBordered` / `isStriped`.

## Status / next

- Current step: implemented; quality gate green; PR #445 open for review
- Blockers: none
- Next: merge, then delete this file
