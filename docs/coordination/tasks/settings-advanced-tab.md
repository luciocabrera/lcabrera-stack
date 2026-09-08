---
id: settings-advanced-tab
title: Move totals and tabs order into an Advanced settings tab
owner: agent:claude
status: active
branch: feat/1118-settings-advanced-tab
area:
  - packages/ui/src/components/Table/TableSettingsDrawer/**
  - packages/ui/src/components/Settings/**
  - packages/ui/src/contexts/GlobalSettingsContext/**
  - packages/ui/src/utils/globalSettings/**
  - packages/ui/src/design-system/tokens/drawerSection.stylex.ts
started: 2026-09-08
updated: 2026-09-08
plan: (none)
pr: (none)
issue: #1118
---

## What

Split the table settings panel by what each tab is for. A new Advanced tab holds
the totals mode, the totals position and the tab order; General goes back to
being the query state's clear and reset, and gains the Grouping pair it was
missing; Grouping keeps only dimensions and measures. The tab order also gains a
global default on the Settings page, and a draggable row's label truncates
instead of wrapping. ADR-115.

## Status / next

- Current step: implemented; running the full gate before the PR
- Blockers: none
- Next: open the PR against #1118
