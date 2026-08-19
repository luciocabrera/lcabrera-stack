---
'@lcabrera/api': minor
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

A date or timestamp column can now be a group key at a chosen granularity —
year, quarter, month or day — instead of being refused for holding one value per
calendar day.

```ts
await selectGroupedRows({
  aggregates: [{ fn: 'count' }, { column: 'total_amount', fn: 'sum' }],
  allowedColumns: ['order_date', 'total_amount'],
  grouping: 'rollup',
  keys: ['order_date'],
  maxRows: 5000,
  periods: { order_date: 'month' }, // ← new
  schema: 'public',
  table: 'orders',
});
```

The granularity is a **column-keyed map beside** the key list, not a member of
it: a column can be a group key at most once, so a map is per-key by
construction and `keys` stays `readonly string[]` in both packages, in the URL
and in every group path. `OlapGroupPeriod` lives in `@lcabrera/api` and both
other packages alias it — it travels in two params, so it is wire vocabulary.

**`ColumnGroupingCapability` gains `periods`, and it is independent of
`canGroup`.** A date column is routinely refused as a raw key and legal at a
month, so read `periods` _instead of_ `canGroup` for a temporal column rather
than after it:

```ts
{ column: 'order_date', typeName: 'date', role: 'dimension',
  canGroup: false, refusal: 'too-many-distinct', distinctEstimate: 1800,
  periods: ['month', 'quarter', 'year'] }
```

The cardinality guard measures the **truncated** expression. `pg_stats` has no
distinct count for `date_trunc('month', c)`, so the capabilities query now reads
the column's histogram range and the estimate is bounded by both that range and
the raw distinct count.

**Truncation is performed in a stated time zone.** `date_trunc(field,
timestamptz)` resolves against the session `TimeZone`, so the same order falls in
December for one caller and January for another. `timestamptz` keys are pinned to
UTC; `date` and `timestamp` are cast so the call cannot promote them through the
session zone.

**Drilling a truncated group is a half-open range**, `gte` the period start and
`lt` the next — the group's value is a period start no row holds, so an equality
returns the boundary row alone. `toDrillRead` takes a new `truncations` argument
for this; `toGroupKeyTruncations` builds it from the capabilities. `toGroupRow`
and `decodeGroupedRows` take the same argument, and use it to head a period group
`2021-06` rather than with an ISO instant.

In `@lcabrera/ui`, an applied temporal key in the settings drawer carries a
granularity control offering exactly the periods the route reports. The
`grouping` URL param gains a `gran` member beside `agg`; it is dropped when
empty, so an untruncated grouping produces the link it always did.

**Breaking for anyone constructing these types by hand.**
`ColumnGroupingCapability.periods` and `TableGroupingState.periods` are required
rather than optional — a surface that omitted one would silently offer nothing.
Values produced by `getColumnGroupingCapabilities` and the loader are unaffected.
