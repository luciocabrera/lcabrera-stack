---
id: split-table-meta-state
title: split TableMetaState into capability, grouping query, and chrome
owner: agent:claude
status: review
branch: refactor/1141-split-table-meta-state
area:
  - packages/ui/src/components/Table/**
  - packages/ui/src/routing/**
  - packages/ui/src/hooks/**
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/components/TableRouteView/**
  - packages/ui/src/utils/urlState/**
  - apps/showcase/src/routes/**
  - .changeset/**
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1151
issue: #1141
---

## What

split TableMetaState into capability, grouping query, and chrome

## Status / next

- Current step: implementing the type split
- Blockers: none
- Next: quality gate, then PR body
