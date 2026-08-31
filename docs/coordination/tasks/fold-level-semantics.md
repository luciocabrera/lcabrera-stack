---
id: fold-level-semantics
title: A fold control folds the groups its own column states
owner: agent:claude
status: review
branch: chore/1041-fold-level-semantics
area:
  - packages/ui/src/components/Table/contexts/TableConfig/**
  - packages/ui/src/components/Table/hooks/**
  - packages/ui/src/components/Table/ARCHITECTURE.md
  - packages/ui/src/components/Table/TableHeaderCell/**
  - packages/ui/src/components/Table/commands/**
  - packages/ui/src/components/Table/Table.groupLevelFold.test.tsx
  - packages/ui/src/INVENTORY.md
  - docs/decisions/ADR-097*
  - .changeset/**
started: 2026-08-30
updated: 2026-08-30
plan: (none)
pr: 'https://github.com/luciocabrera/lcabrera-stack/pull/1042'
issue: #1041
---

## What

A fold control folds the groups its own column states

## Status / next

- Current step: review thread on ADR-097's drill citation cleared; gate green
- Blockers: none
- Next: renumber to ADR-098 once #1038 merges, on the coordinator's word. The PR
  stays draft until then.
