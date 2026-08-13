---
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

Row grouping supports several keys at once, and which aggregates a column may
take is now decided by that column's real Postgres type rather than by its
declared `dataType`.

**What is new**

- **Multi-key grouping** up to `MAX_TABLE_GROUP_KEYS`, refused beyond it. The
  key order is the grouped query's nesting order, so it is preserved
  end to end and a reorder is a real edit.
- **Aggregate selection**, one aggregate per column, offered from the
  catalogue's per-column answer. A menu shaped from `TableColumn.dataType`
  offers `sum` on a `numeric` it reports as `string` and hides it on the one
  column that can take it; this reads the real type instead (ADR-058).
- **A Grouping tab** in the table settings drawer, present only where the route
  declared `isGroupingEnabled`.
- `createTableRouteLoader` takes an optional `resolveGroupingCapabilities`, and
  ships its answer on `metaState.groupingCapabilities` — spread last and
  unconditionally, so a client-controlled cookie cannot seed it (ADR-063).
- `@lcabrera/server` exports `db/group-query-builder/group-query-builder.constants`.

**What this deliberately does not do**

- **Filtered aggregates are deferred.** The compact `grouping` search param
  carries a column-to-function map with no slot for a per-aggregate filter or
  alias, so a filtered aggregate cannot round-trip through the transport the
  whole grouping configuration travels in. Every path `@lcabrera/ui` owns is
  closed to one — no menu entry, no command, and no state the grouping store can
  hold describes it. `GroupAggregate.filters` still exists on
  `@lcabrera/server`, so a consumer calling `selectGroupedRows` directly can
  still build a filtered aggregate: what is closed is reaching one through the
  table, not the capability itself. Lifting the deferral means extending the
  param first.
- **A group key or aggregate the database catalogue refuses still raises.** Both
  menus are built from the resolved capabilities, so the table cannot offer one;
  a request assembled by hand reaches `assertGroupKeys` /
  `assertGroupAggregates` and throws. Rendering that refusal instead is tracked
  separately, and `groupingCapabilities` carries `canGroup` and the refusal
  reason for it.

**Breaking, for a consumer of `@lcabrera/ui`**

- `TableGroupRowSummary` replaces `columnKey`/`label` with `path`, an ordered
  list of `{ columnKey, label }`, and adds `aggregates`. A single-key grouping
  is the one-element case. A route that builds group rows itself has to build
  the new shape; `getTableGroupRowSummary` refuses the old one rather than
  rendering half a group heading.
- `TableGroupingState` gains a required `aggregates` map.
- `createTableRouteLoader`'s loader is now `async`, and the `grouping` it hands
  `fetchPage` is a `TableGroupingState` rather than a `readonly string[]`.
  `TableRouteLoaderData` is unchanged for consumers — it awaits the return — but
  a route that called the loader directly must await it.
