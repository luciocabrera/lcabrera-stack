---
'@lcabrera/ui': minor
---

A table route can declare a default grouping and lock it, and where totals sit is now a user setting that reaches the query.

`createTableRouteLoader` takes `defaultGrouping`, applied when the URL carries no `grouping` param, and `meta.isGroupingLocked`, which fixes the grouping's shape — keys, mode and per-key granularity — while leaving the aggregates editable. The lock is honoured at every surface that reshapes a grouping, the column-header menu included, not only in the settings drawer.

Totals placement is chosen in the drawer beside the grouping mode, persists across sessions in the UI-flags cookie, and travels in a `totals` search param so it reaches the emitted `ORDER BY` rather than only the rendering. Absent, it is `last` — the placement the query builder already applied, so a route that never offers the choice emits unchanged SQL.

One behaviour changes for routes that declare a default grouping: clearing the grouping now writes an explicit empty `grouping` param instead of dropping it, so "ungrouped" survives the next navigation. Routes without a default produce byte-identical URLs.

`isGroupDrillEnabled` is now resolved from the route's own `meta` alongside the other capabilities, so the persisted UI-flags cookie can no longer seed it — its documented contract all along.
