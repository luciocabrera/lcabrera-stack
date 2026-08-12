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
