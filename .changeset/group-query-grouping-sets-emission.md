---
'@lcabrera/server': minor
---

Add `buildGroupQuery` — grouped reads over `GROUP BY GROUPING SETS`.

New subpath `./db/group-query-builder/build-group-query.util`. It turns a
`GroupQueryDescriptor` into a parameterized grouped query: the group keys, one
variadic `GROUPING(k₁, …, kₙ)` mask, the requested aggregates (with optional
`FILTER (WHERE …)`), `GROUP BY GROUPING SETS`, a subtotal-aware `ORDER BY` and a
`LIMIT` backstop. `flat` and `rollup` are supported; rollup is expanded into
explicit sets in TypeScript rather than emitted as `ROLLUP(…)` sugar (ADR-059).

The result carries `keys`, `maskAlias` and `groupingSetMasks` beside the SQL,
because a grouped row cannot be read without them: under a rollup, a NULL
`shipping_country` is either a real NULL or the subtotal across every country,
and only `GROUPING()` tells them apart.

Legality is passed in, not re-derived. The descriptor takes the
`ColumnGroupingCapability` map that `getColumnGroupingCapabilities` resolves
from the catalogue, and the builder refuses a group key the catalogue turned
down or an aggregate it does not offer — so `min(jsonb)` is a message naming the
column and its type rather than a driver error at execution. `allowedColumns` is
**required** here, unlike `SelectQueryDescriptor` where it is opt-in: every group
key is request-derived by construction.

Two construction-time refusals worth knowing about, both for failures Postgres
reports quietly. An alias longer than 63 characters is refused rather than
truncated, because Postgres truncates with only a `NOTICE` and `pg` then folds
two truncation-equal aliases into one row key holding the second value — losing
the first column with no error anywhere; pass a shorter explicit `alias`. And a
projected alias may not collide with a real column of the table, which is what
would otherwise happen to `group_mask` or `count_rows`.

Additive: no existing export changed, and `GroupingMode` is `'flat' | 'rollup'`
today. Grouping guard rails, the per-query timeout and cube expansion are not
part of this.
