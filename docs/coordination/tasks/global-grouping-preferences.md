---
id: global-grouping-preferences
title: Add a Grouping tab to Global Settings
owner: agent:claude
status: review
branch: chore/1052-global-grouping-preferences
area:
  - packages/ui/src/components/Settings/**
  - packages/ui/src/contexts/GlobalSettingsContext/**
  - packages/ui/src/utils/globalSettings/**
  - packages/ui/src/types/globalSettings.types.ts
  - packages/ui/src/constants/groupingPreferences.constants.ts
  - packages/ui/src/routing/loaders/**
  - packages/ui/src/components/Table/contexts/TableConfig/expansion/**
started: 2026-08-31
updated: 2026-08-31
plan: (none)
pr: #1053
issue: #1052
---

## What

Add a Grouping tab to Global Settings

## Status / next

- Current step: in review — the Grouping tab ships with all three preferences
  applied, `vp run check:safe` is green (77 tasks), and #1053 is out of draft.
- Blockers: none. One thing needs a person at a running app: setting _Start
  collapsed_ and confirming a grouped table lands folded with no flash.
- Next: address review threads, then merge. **Merge #1051 first** — this branch
  also adds rows to `packages/ui/src/INVENTORY.md` and a changeset, so whichever
  lands second rebases.
