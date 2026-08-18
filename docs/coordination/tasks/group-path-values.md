---
id: group-path-values
title: A group path carries its key values
owner: agent:claude
status: review
branch: chore/775-group-path-values
area:
  - packages/ui/src/components/Table/**
  - apps/react-router/src/routes/enterprise-orders/config/**
started: 2026-08-18
updated: 2026-08-18
plan: (none)
pr: #781
issue: #775
---

## What

`TableGroupKeyValue` gains `value` beside its formatted `label`, so a group row
can be turned back into the restriction it came from. Prerequisite for the drill
chain (#776, #777) that ADR-079 specifies.

The label stays formatted and the expansion encoding is untouched, so stored
collapses keep matching.

## Status / next

- Current step: implemented, gate green, changeset + api-surface done
- Blockers: none
- Next: review on PR #781
