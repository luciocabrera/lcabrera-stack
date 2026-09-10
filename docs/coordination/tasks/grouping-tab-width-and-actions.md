---
id: grouping-tab-width-and-actions
title: the grouping tab keeps its width and clears each subject on its own
owner: agent:claude
status: active
branch: feat/1168-grouping-tab-width-and-actions
area:
  - packages/ui/src/components/Tabs/**
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/TableSettingsDrawer/TableSettingsDrawerBody/**
  - packages/ui/src/components/Table/TableSettingsDrawer/TableDrawerContext/actions/**
  - .changeset/grouping-tab-width-and-actions.md
  - reports/api-surface/**
started: 2026-09-10
updated: 2026-09-10
plan: (none)
pr: (none)
issue: #1168
---

## What

A `TabItem` can drop the tab body's horizontal inset, and the Grouping tab uses
it so its nested strip is inset once rather than twice (#1168).

Group keys and aggregates each gain a clear and a reset, in the sub-tab header
that owns them; the whole-grouping pair stays in the footer (#1169).

## Note

Clearing the last group key still clears the aggregates with it.
`resolveTableGroupingUpdate` collapses the whole grouping when no key remains,
and the draft goes through the same reducer, so the state has no way to hold a
measure with nothing to measure over. Faked in the draft it would only be
discarded on Accept.
