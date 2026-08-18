---
id: group-drill-read
title: Translate a group row into its drilled read
owner: agent:claude
status: review
branch: chore/776-group-drill-read
area:
  - apps/react-router/src/routes/enterprise-orders/**
  - packages/server/src/db/query-builder/**
started: 2026-08-18
updated: 2026-08-18
plan: (none)
pr: #784
issue: #776
---

## What

`toOrderDrillRead` — a pure translation from a group row plus the grouped view's
filters and sort to the arguments of the paginated read, per ADR-079.

Also adds `isNull` to `@lcabrera/server`'s filter vocabulary: it had `isNotNull`
and no complement, and a NULL group key cannot be expressed as an equality.

## Status / next

- Current step: implemented, both lanes green, changeset + api-surface done
- Blockers: none
- Next: review on PR #784
