---
id: grouping-legality-spike
title: Settle whether TableColumnDataType can gate group-key legality
owner: agent:claude
status: active
branch: test/550-grouping-legality-spike
area:
  - apps/react-router/src/routes/wide-alltypes-150/**
started: 2026-08-11
updated: 2026-08-11
plan: docs/agents/planning/table-row-grouping-plan.md
pr: (none)
issue: 550
---

## What

Lands the falsification probe for the row-grouping design's central premise as a
committed smoke test: that `TableColumnDataType` is sufficient to gate which
columns may be grouped and which aggregates are legal.

It is not, in both directions, and `wide_alltypes_150` is the only route fixture
with the type variety to show it. The probe also has to rule out the obvious
confound for the `n_distinct = 0` case — a never-`ANALYZE`d table — because that
is what decides whether the §2.8 guard treats such a column as "unknown, proceed"
or refuses it.

Gates #552 (the ADR) and #563 (the catalogue implementation), which is the whole
reason it is Wave 1 rather than part of the rollout slice.

## Status / next

- Current step: probes reproduced by hand against `car_sales_db`; writing them up
  as a `*.smoke.test.ts` beside the existing enterprise-orders smoke suite.
- Blockers: none.
- Next: widen the app's `test:smoke` task, which currently filters to a single
  file, then run the gate and open the PR.
