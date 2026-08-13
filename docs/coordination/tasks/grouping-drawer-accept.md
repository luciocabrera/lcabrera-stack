---
id: grouping-drawer-accept
title: Stage grouping edits and commit on Accept
owner: agent:claude
status: review
branch: chore/654-grouping-drawer-accept
area:
  - packages/ui/src/components/Table/TableSettingsDrawer/**
  - packages/ui/src/components/Table/contexts/TableConfig/grouping/**
  - packages/ui/src/components/Table/contexts/TableConfig/ARCHITECTURE.md
  - packages/ui/src/components/Table/contexts/TableConfig/columns/actions/useBatchSetTableSettings.hook.*
  - packages/ui/src/INVENTORY.md
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/655
issue: #654
---

## What

Stage grouping edits in a `TableDrawerContext` draft and commit the whole
configuration on Accept, in one navigation.

## Status / next

- Current step: review findings addressed (two orphaned live hooks deleted,
  doc contradictions fixed); gate re-run
- Blockers: none
- Next: verification
