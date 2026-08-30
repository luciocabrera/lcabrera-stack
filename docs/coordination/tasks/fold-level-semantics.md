---
id: fold-level-semantics
title: A fold control folds the groups its own column states
owner: agent:claude
status: active
branch: chore/1041-fold-level-semantics
area:
  - packages/ui/src/components/Table/contexts/TableConfig/expansion/**
  - packages/ui/src/components/Table/hooks/**
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

- Current step: fold change implemented, gate running
- Blockers: none
- Next: dependency refresh in its own commit, then review
