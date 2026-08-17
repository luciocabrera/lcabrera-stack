---
id: bound-filter-options-window
title: Bound the filter-options page window
owner: agent:claude
status: review
branch: chore/736-bound-filter-options-window
area:
  - apps/react-router/src/routes/api/filter-options/**
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: 739
issue: #736
---

## What

Bound the page window `/_api/filter-options` serves, at `selectDistinctFilterOptions`
rather than at the published `parseFilterOptionsParams`.

## Status / next

- Current step: PR #739 open for review, full gate green
- Blockers: none
- Next:
  - Review of #739.
  - The live-database criterion is unverified — no Docker, no reachable
    Postgres, no `psql` in this environment. Recorded in the PR's Known
    Limitations, same as #735.
  - Decided **against** a defensive ceiling inside `@lcabrera/server`'s
    `selectFilterOptions`, which the issue asked to consider. Reasoning is in
    the PR; if a reviewer disagrees it is a separate change.
