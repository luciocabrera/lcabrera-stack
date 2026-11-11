---
id: table-title-density
title: feat(ui): give the Table title bar a density of its own
owner: agent:claude
status: review
branch: chore/1637-table-title-density
area:
  - packages/ui/src/components/Table/**
  - packages/ui/src/components/Title/**
  - packages/ui/src/components/Settings/**
  - packages/ui/src/constants/tableDisplayPreferences.constants.ts
  - packages/ui/src/types/globalSettings.types.ts
  - packages/ui/src/utils/globalSettings/**
  - packages/ui/src/contexts/GlobalSettingsContext/**
  - packages/ui/src/INVENTORY.md
  - reports/api-surface/ui.txt
  - .changeset/table-title-density.md
  - packages/ui/src/public-api.ts
  - packages/ui/src/PATTERNS.md
  - packages/ui/src/stylex-module-paths.test.json
  - docs/product/requirements/table-density-follows-my-default.md
started: 2026-11-11
updated: 2026-11-11
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1638
issue: #1637
---

## What

feat(ui): give the Table title bar a density of its own

## Status / next

- Current step: implemented, running the quality gate
- Blockers: none
- Next: mark the PR ready
