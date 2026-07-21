---
id: table-filter-cancellation
title: Time-bound filter-option requests so a hung endpoint cannot wedge a dropdown
owner: agent:claude
status: review
branch: feat/table-filter-cancellation
area:
  - packages/ui/src/components/Table/contexts/FiltersData/**
  - packages/ui/src/utils/filters/**
  - packages/ui/src/components/Table/Table.constants.ts
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #178
---

## What

#178 was filed as "cancel superseded filter-option page requests". Probing the
actual behaviour before implementing showed that premise is false: three rapid
`fetchMore` calls issue exactly **one** request, because the `isLoadingMore`
guard is read and set with no `await` between, making the check-and-claim atomic
on JS's single thread. `fetchInitial` has the same shape. There is nothing to
cancel.

The same probe exposed a real bug the guard causes. It is cleared only when a
request _settles_ — a rejection is handled, silence is not. An endpoint that
accepts a request and never answers leaves the flag set, so every later page for
that column returns early and the dropdown is wedged until the table remounts.

Fix: bound each network-backed filter-options request with
`FILTER_OPTIONS_TIMEOUT_MS`, using the opt-in `timeoutMs` that #177 added and
left unwired. That converts silence into the rejection the existing error path
already clears and reports.

## Status / next

- Current step: PR open, quality gate green.
- Blockers: none.
- Next: merge, then delete this file. #178 rewritten to describe the real bug.
