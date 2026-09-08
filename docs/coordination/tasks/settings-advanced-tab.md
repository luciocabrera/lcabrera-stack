---
id: settings-advanced-tab
title: Split the table settings panel by what each tab is for
owner: agent:claude
status: review
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
pr: #1119
issue: #1118
---

## What

Split the table settings panel by what each tab is for. A new Advanced tab holds
the totals mode and the totals position; General goes back to being the query
state's clear and reset, and gains the Grouping pair it was missing; Grouping
keeps only dimensions and measures. The tab order leaves the table entirely and
becomes a global preference on the Settings page, and a draggable row's label
truncates instead of wrapping. ADR-115.

## Status / next

- Current step: draft PR #1119 open, gate green
- Blockers: none
- Next: address review threads, then mark ready
