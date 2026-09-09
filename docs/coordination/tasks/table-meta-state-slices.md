---
id: table-meta-state-slices
title: decide how TableMetaState is sliced
owner: agent:claude
status: review
branch: docs/1138-table-meta-state-slices
area:
  - docs/decisions/**
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1144
issue: #1138
---

## What

ADR-118 names the slices of `TableMetaState` (capability, grouping query,
chrome), which store owns each, and where filter-fetch failures live.

## Status / next

- Current step: renumbered off ADR-116/117 (open PRs #1134/#1135)
- Blockers: none
- Next: gate, commit, ready the PR
