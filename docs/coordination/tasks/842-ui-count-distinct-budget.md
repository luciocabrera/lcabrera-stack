---
id: 842-ui-count-distinct-budget
title: Stop offering a second countDistinct the read cannot carry
owner: agent:claude
status: review
branch: fix/842-842-ui-count-distinct-budget
area:
  - packages/ui/src/components/Table/**
  - packages/ui/src/routing/shared/**
  - packages/ui/src/INVENTORY.md
  - apps/react-router/src/routes/enterprise-orders/.server/groupingContract.test.ts
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: '#852'
issue: #842
---

## What

Stop offering a second countDistinct the read cannot carry: withhold it from both
aggregation surfaces while one is applied, explain the gap where that empties the
drawer's function control, refuse a URL naming two at the client's own sanitizer,
and enumerate which `group-query-builder` guard rails this side can breach by
construction.

## Status / next

- Current step: implemented, gate run, PR ready for review
- Blockers: none
- Next: address review findings
