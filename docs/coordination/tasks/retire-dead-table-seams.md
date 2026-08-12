---
id: retire-dead-table-seams
title: Retire the dead table seams grouping would otherwise inherit
owner: agent:claude
status: review
branch: chore/566-retire-dead-table-seams
area:
  - packages/ui/src/components/Table/**
  - packages/ui/src/utils/urlState/**
  - packages/ui/src/routing/loaders/**
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: 635
issue: #566
---

## What

Retire the four table seams that are wired to nothing, so #568 (the grouping
walking skeleton) cannot inherit or extend them, and correct the two
architecture claims that describe a mechanism that is not there.

`packages/ui/src/routing/loaders/**` is in the area because the `tableState` URL
param's only production reader lives there; removing the encoder without it
would leave a decoder for a param nothing writes.

## Status / next

- Current step: implemented, full gate green, draft PR #635 open
- Blockers: none
- Next: review, then delete this file when #635 merges
