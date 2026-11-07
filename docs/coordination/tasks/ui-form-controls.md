---
id: ui-form-controls
title: Add Select, TextInput and DescriptionList to @lcabrera/ui
owner: agent:claude
status: active
branch: feat/1558-ui-form-controls
area:
  - packages/ui/src/components/Select/**
  - packages/ui/src/components/TextInput/**
  - packages/ui/src/components/DescriptionList/**
  - packages/ui/src/components/VirtualSelect/**
  - packages/ui/src/components/Card/**
  - packages/ui/src/components/InfoBox/**
  - packages/ui/src/components/Tag/**
  - packages/ui/src/components/Tooltip/**
  - packages/ui/src/components/TrendSparkline/**
  - packages/ui/src/components/Form/fields/TextField/**
  - packages/ui/src/components/Form/fields/formInput.stylex.ts
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/ActiveGroupKeyList/GroupKeyPeriodSelect/**
  - packages/ui/src/public-api.ts
  - packages/ui/src/stylex-module-paths.test.json
  - packages/ui/src/utils/tests/getFormQuery.util*
  - packages/ui/package.json
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - reports/api-surface/ui.txt
  - .changeset/ui-form-controls.md
started: 2026-11-07
updated: 2026-11-07
plan: (none)
pr: '#1595'
issue: #1558
---

## What

Add Select, TextInput and DescriptionList to @lcabrera/ui

## Status / next

- Current step: implemented; fallow preflight blocked on one finding sent for adjudication
- Blockers: VirtualSelect cognitive complexity from prop count (fallow health)
- Next:
