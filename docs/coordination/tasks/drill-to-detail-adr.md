---
id: drill-to-detail-adr
title: Decide whether the grid drills from a group into its rows
owner: agent:claude
status: review
branch: docs/772-drill-to-detail-adr
area:
  - docs/decisions/ADR-079-drilling-from-a-group-to-its-rows.md
started: 2026-08-18
updated: 2026-08-18
plan: (none)
pr: '#778'
issue: #772
---

## What

ADR-079: a group drills to one bounded page of its rows and hands off to the
pre-filtered ungrouped table for the rest. Files the children the decision
admits.

The blocker the ADR surfaced, which the issue did not know about:
`TableGroupKeyValue` carries the group key **formatted**, so a NULL key is the
string `(empty)` and a path cannot be translated into filters as it stands. Same
failure #765 fixed on the aggregate side.

## Status / next

- Current step: ADR written, children filed, in review
- Blockers: none
- Next: the value-carrying path (#775) is the prerequisite for everything else
