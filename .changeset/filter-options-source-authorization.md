---
'@lcabrera/server': minor
---

`@lcabrera/server` gains `resolveFilterOptionsSource`
(`@lcabrera/server/filters/resolve-filter-options-source.util`) — the
authorization step in front of `selectFilterOptions`, plus the
`FilterOptionsSources` registry shape it reads.

`selectFilterOptions` allow-lists the column it is handed, but `schema` and
`table` reach it as data and it has no basis to judge either. A consumer serving
a generic distinct-values endpoint receives all three identifiers on a request,
so it must decide **which sources may be asked at all** before any SQL is
composed — and that question has had no package-side answer, which is why two
consumers in this repository had each hand-rolled the same lookup.

The registry stays the caller's: `schema.table` → the columns that source
exposes → each column's `ColumnType`. What the package now owns is the rule.
Given a request it returns the source's `allowedColumns` and the column's type,
ready to hand to `selectFilterOptions`, or a refusal that separates an unknown
source from an unknown column — a value rather than a throw, because the edges
consuming it answer differently and neither wants to catch. Keep the refusal out
of the response body: naming which half failed tells a caller which tables
exist.

Both lookups read own properties only, so a request for the column
`constructor` is refused rather than resolving to `Object`'s and producing a
`columnType` that is a function.

Additive only — no existing export changes.
