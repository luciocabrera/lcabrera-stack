---
id: date-period-grouping
title: Group a date column by a derived period
owner: agent:claude
status: review
branch: chore/786-date-period-grouping
area:
  - packages/server/src/db/group-query-builder/**
  - packages/server/src/db/olap/**
  - packages/api/src/olap/**
  - packages/ui/src/components/Table/contexts/TableConfig/grouping/**
  - packages/ui/src/utils/urlState/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: #814
issue: #786
---

## What

A granularity on a temporal group key — year, quarter, month or day — with the
cardinality guard measuring the truncated expression rather than the raw column,
a stated truncation time zone, and a drilled period expressed as a half-open
range. Recorded as
[ADR-084](../../decisions/ADR-084-a-group-key-carries-its-granularity.md).

## Status / next

- Current step: implemented; full gate green, including the live-DB smoke suite
- Blockers: none
- Next: push, address review
