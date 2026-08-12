---
id: multi-key-grouping
title: Multi-key grouping, aggregate selection and the grouping drawer section
owner: agent:claude
status: active
branch: feat/569-multi-key-grouping
area:
  - packages/ui/src/components/Table/contexts/TableConfig/**
  - packages/ui/src/components/Table/commands/**
  - packages/ui/src/components/Table/TableHeaderCell/**
  - packages/ui/src/components/Table/TableSettingsDrawer/**
  - packages/ui/src/components/Table/TableGroupHeaderRow/**
  - packages/ui/src/utils/urlState/**
  - packages/ui/src/routing/**
  - packages/server/src/db/group-query-builder/**
  - packages/ui/src/components/Table/utils/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-12
updated: 2026-08-13
plan: (none)
pr: '#646'
issue: #569
---

## What

Multi-key grouping, aggregate selection and the grouping drawer section

## Status / next

- Current step: implemented; full gate green and the live-Postgres smoke suite
  passes. Awaiting independent verification.
- Blockers: none
- Next:
