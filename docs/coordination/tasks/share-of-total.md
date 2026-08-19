---
id: share-of-total
title: Share-of-total measure and its proportional bar
owner: agent:claude
status: active
branch: chore/648-share-of-total
area:
  - packages/server/src/db/**
  - packages/ui/src/components/Table/**
  - packages/api/src/olap/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: #819
issue: #648
---

## What

Each measure as a percentage of the grand total, with a proportional bar.

## Status / next

- Current step: implementing
- Blockers: none

## The three questions the issue asks to answer first

**What is the denominator? The grand total.** The issue's own implementation
note settles this ("The grand total is the denominator, and #570 is what makes a
grand total exist"), and the rollup row carrying it is already identified by
`isSubtotal` with an empty `path` rather than inferred.

**Where is it computed? Client-side.** A grouped read is whole — ADR-059 gives
it `hasMore: false` — so the client provably holds every row the denominator is
drawn from. Under `rollup` the denominator _is_ a row the server computed;
measured against the seeded fixture, the grand-total row's
`sum(total_amount)` is `21302893287.00`, exactly the ungrouped `sum`. Under
`flat` there is no grand-total row and the leaves are summed instead, which is
exact for the measures a share is offered on (below).

The server route is not merely more expensive, it is wrong as usually written:
under `GROUP BY GROUPING SETS` a bare `sum(x) OVER ()` windows over the _result_
rows, which include every subtotal and the grand total, so it double-counts.
Getting it right needs a mask-filtered window — a new emission kind outside
ADR-059's aggregate vocabulary — to produce a number the client already holds
exactly.

**Does it lie? Yes, and it inherits the existing indicator.** A `WHERE` filter
runs before aggregation, so a share divides a filtered measure by a filtered
total. `TableGroupAggregate` already renders
`TABLE_GROUP_FILTERED_AGGREGATE_LABEL` for exactly this, and the share renders
inside that same cell, so it inherits the obligation rather than restating it.

## The constraint the issue did not anticipate

**A share is only well defined for an _additive_ measure**, so it is offered on
`sum` and `count` and on nothing else. Measured against the seeded fixture:

| measure                            | true grand total | summed across groups |
| ---------------------------------- | ---------------- | -------------------- |
| `sum(total_amount)`                | 21302893287.00   | 21302893287.00       |
| `avg(total_amount)`                | 21302.8933       | 20693.1712           |
| `count(DISTINCT shipping_country)` | 3                | 24                   |

`countDistinct` is the dangerous one: shares computed against 24 would still sum
to 100% and read as correct while being wrong by 8×.

## Where it renders

Inside `TableGroupAggregate`, beneath the number — **not** in a derived column.
ADR-080 removed column injection ("No column is added — a group row states each
key's value in that key's own column"), so a share column would reintroduce
exactly what that decision took out.
