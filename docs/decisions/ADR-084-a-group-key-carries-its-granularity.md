# ADR-084 — A temporal group key carries a granularity, and the guard measures the truncated key

- **Status:** Accepted
- **Date:** 2026-08-19
- **Scope:** `@lcabrera/api` — the granularity vocabulary and its two params; `@lcabrera/server` — the truncation, the cardinality estimate and the drilled range; `@lcabrera/ui` — the applied-key control
- **Issue:** #786 — group a date column by a derived period, not by the raw day
- **Extends:** [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) — the same two gates, asked of a derived key
- **Narrows:** [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — records why this vocabulary is _not_ one of the shapes it governs
- **Related:** [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (the URL the granularity travels in), [ADR-066](./ADR-066-grouping-guard-rails-and-per-query-timeout.md), [ADR-079](./ADR-079-drilling-from-a-group-to-its-rows.md) (the drill this changes the shape of), [ADR-082](./ADR-082-the-olap-seam-lives-in-the-packages.md) (why the vocabulary lives in `@lcabrera/api`)

## Context

Time is the dimension every OLAP report is organised by, and it was the one this
grid refused. Read live from the seeded fixture:

```json
{
  "column": "order_date",
  "role": "dimension",
  "typeName": "date",
  "canGroup": false,
  "refusal": "too-many-distinct",
  "distinctEstimate": 1800
}
```

The refusal is correct as a **cardinality** rule — `MAX_GROUP_KEY_DISTINCT` is
1000, and one group per calendar day is exactly the tree it exists to refuse. It
is wrong as a **time** answer, because nobody asks to group by day. They ask for
a year, a quarter or a month.

## Problem

The guard is measuring the wrong column. It reads the distinct count of
`order_date` when the question is the distinct count of
`date_trunc('month', order_date)` — sixty on the same fixture, comfortably legal.
And `GroupKey` is a column name, which cannot carry a granularity at all.

Three things follow, and only the first is about SQL.

1. **The catalogue has no answer for a derived key, and never will.** `pg_stats`
   describes columns; nothing in it counts the distinct months in one.
2. **A group key stops being a column name**, on both sides of a boundary that
   six unrelated things already agree on: `keys` is `readonly string[]` in
   `@lcabrera/ui`, in `@lcabrera/server`, in the URL param, in every group path,
   in the expansion store's keys and in the drill request.
3. **Drilling changes shape.** `2021-06` is not a value any row holds, so the
   `eq` filter a path entry becomes returns the first of the month and nothing
   else.

## Decision

### The granularity is a column-keyed map beside the key list

`periods: Record<string, GroupKeyPeriod>` travels beside `keys`, not inside it.
A column can be a group key at most once, so a column-keyed map is per-key by
construction and carries the same information as a key list of records — without
moving the element type of a shape six things agree on. A granularity naming a
column that is not a key is **refused**, not ignored: the two can disagree
because they travel separately, and silently dropping one runs a grouping the
URL does not describe.

### The vocabulary lives in `@lcabrera/api`, and is not duplicated

It travels in the grouping param and again in the drill param, so it is wire
vocabulary (ADR-082). Both packages already declare `@lcabrera/api`, so ADR-039
does not apply: its rule is about an **undeclared** edge, and there is none here
to route around. `GroupKeyPeriod` and `TableGroupPeriod` are aliases of one
declaration. `groupingContract.test.ts` still asserts it, and the assertion is
not redundant — it is what fails if either package ever restates the union
locally, which is the change that would make them able to disagree.

`week` is deliberately absent. `date_trunc('week', …)` is ISO Monday and a
reporting week is as often Sunday or fiscal; offering exactly one of those
conventions under an unqualified name is worse than not offering it, and #786
puts week numbering out of scope rather than settling it in passing.

### The guard measures the truncated key, from the histogram's range

The capabilities query reads `pg_stats.histogram_bounds` and returns the column's
range in days. The period estimate is then bounded **twice**, and both bounds are
needed:

- by the **raw** distinct estimate, because truncation is a function and cannot
  produce more values than it consumed;
- by the **range**, because a truncated value is a period and there can be no
  more of them than the range contains.

A column of 1800 daily dates has a raw estimate of 1800 whatever period is asked
for; a one-day span behind a million rows has a range bound of one whatever the
raw count is.

**The range is measured in the frame the truncation will run in**, which is the
same split the truncation itself takes. Casting a `date` to `timestamptz` reads
both endpoints through the session zone, and a range straddling a DST transition
measures an hour short — under `America/Santiago`, 1 June to 1 December is
182.958 days rather than 183. The period count floors that number, so an
under-measured range can offer a granularity the guard would have refused, which
is the one direction an **upper** bound must not be wrong in.

`ColumnGroupingCapability` gains `periods`, and it is **independent of
`canGroup`**: a date column is routinely refused as a raw key and legal at a
month, so a surface reading `canGroup` alone hides the dimension this exists to
serve — which is not hypothetical. The first version of this change left
`resolveGroupKeyAvailability` reading `canGroup` alone, so `order_date` never
appeared in the add-key list, no key could carry a granularity, and the
granularity control could never render: the whole feature was unreachable
through the UI while every unit test passed.

**A column offered only truncated is added _with_ its granularity**, in one
edit. The finest on offer is the default, because a reader can coarsen a month
into a year and cannot recover the month from one; adding the key without a
granularity would apply a grouping the server refuses. The refusal ladder is otherwise unchanged — `resolveColumnPeriods` runs
`refuseGroupKey` with the period's estimate substituted, so role, equality and
the unique-ish rule do not become negotiable because a granularity was asked for.

### The truncation timezone is stated, not inherited

`date_trunc(field, timestamptz)` resolves against the session `TimeZone`. Measured
against a live Postgres under `America/New_York`, a February order truncates to
January — so the same request places a row in two different months for two
callers, with nothing in the result saying which happened.

- `timestamptz` takes the three-argument form pinned to UTC.
- `date` and `timestamp` are cast to `timestamp` first, because the two-argument
  call would otherwise _promote_ them through the session zone and hand back a
  value whose rendering moves with the reader.

The consequence is that the two forms materialise in different frames — a
`timestamptz` arrives as the true instant, a cast one as a `Date` holding
wall-clock fields locally — and every later reading of the value has to say which.
That is why `isZoned` travels with the period rather than being inferred, and why
both the period heading and the drilled range take it.

### A drilled period is a half-open range

`gte` the period start and `lt` the next period start, on the raw column. Not
`lte` the last instant, which no timestamp represents exactly. The next boundary
is **calendar arithmetic** — months are 28 to 31 days — performed in the frame
the value was materialised in. A NULL key still becomes `IS NULL`: `date_trunc`
of NULL is NULL, so a truncated key has a NULL group exactly as a raw one does.

## Consequences

- One extra catalogue read on a drill, and only when a granularity is present:
  the client must not assert whether a column is zoned, so the route resolves it.
- The grouped SQL spells one truncation one way in four places — the projection,
  `GROUPING()`, the grouping sets and the `ORDER BY` — because Postgres matches a
  `GROUPING` argument against a `GROUP BY` expression **syntactically**. Two
  spellings fail to plan rather than answering differently, so the duplication is
  loud rather than quiet; it is derived once regardless.
- A truncated key is aliased back to its column name, so the row decoder, the
  group path and the `ORDER BY` value term are unchanged.
- A group row's heading becomes `2021-06` rather than an ISO instant — which is
  also the only correct reading of an unzoned value, whose `toISOString()` names
  the previous month under any positive offset.
- Removing a group key drops its granularity with it. One left behind is not
  inert: the server refuses a granularity whose column is not a key.

## Alternatives considered

**Raise `MAX_GROUP_KEY_DISTINCT`.** The guard is right; the expression it
measures is what changes. A thousand groups is a tree nobody reads whether they
are days or countries.

**Encode the granularity in the key string — `order_date:month`.** Keeps
`readonly string[]` everywhere and makes the granularity travel with its key by
construction, which is genuinely attractive. Rejected because a Postgres column
name may contain a colon, so the encoding is ambiguous for exactly the identifier
the key list exists to carry — and because every consumer of `keys` would then
have to parse rather than compare.

**Measure the truncated cardinality with `count(DISTINCT date_trunc(…))`.**
Exact, and a full scan per capability probe. The histogram range is free, already
permission-filtered, and an upper bound — which is the safe direction for a
refusal.

**Add a `truncEq` filter operator so a drill can compare the truncated
expression directly.** Exactly correct in every timezone and immune to boundary
arithmetic. Rejected because it widens a filter vocabulary that ADR-039 keeps
duplicated across two packages and `filterContract.test.ts` pins, to serve one
server-internal caller. The range uses operators that already exist.

## References

- The measurement is reproducible: `SELECT count(DISTINCT order_date)` against
  `enterprise_orders` is above 1000 while
  `count(DISTINCT date_trunc('month', order_date))` is far below it.
- The timezone claim is asserted with its **counterfactual** in
  `orderDrillRead.smoke.test.ts`: the pinned form's instant is identical under
  two session zones and the unpinned form's is not — a one-sided check would pass
  on a pin that merely agreed with the session.
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md),
  [ADR-066](./ADR-066-grouping-guard-rails-and-per-query-timeout.md) — the two gates this extends
- [ADR-082](./ADR-082-the-olap-seam-lives-in-the-packages.md) — why the
  vocabulary and its codec live in `@lcabrera/api`
