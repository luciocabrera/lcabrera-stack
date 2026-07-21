# Filters Architecture

The **column-filter contract** shared by the Table filter UI and the generic
query layer, plus the pure mappers that translate one into the other. Nothing
here touches the database — the mappers produce `QueryFilter[]` values that the
`db/query-builder` builders (and their executors) consume.

## Why it lives in `@lcabrera/server`

The filter _shapes_ describe the Table's per-column filter state — a UI concept
— but they are also the input to the SQL query layer, so they are a **contract**
between the two. `@lcabrera/ui` already depends on `@lcabrera/server` (not the
reverse), so the shapes and the `→ QueryFilter` mappers must sit here for the
mappers to reach `QueryFilter` without a dependency cycle. `@lcabrera/ui`'s
`types/filterOperators.types` re-exports the shapes for the Table's own call
sites and adds the UI-only operator/option _label_ types on top.

## Files

| File                              | Role                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters.types.ts`                | The discriminated filter shapes: `BooleanFilter`, `DateFilter`, `NumberFilter`, `SelectFilter`, `TextFilter`, and their `ColumnFilter` union |
| `to-query-filters.util.ts`        | **Entry point.** `Record<column, ColumnFilter>` → flat `QueryFilter[]`; dispatches each column to its per-type mapper                        |
| `to-date-query-filters.util.ts`   | Date filter → `gt`/`lt`/`eq`; `between` → `gte` + `lte` (falls back to `eq` with no upper bound)                                             |
| `to-number-query-filters.util.ts` | Number/currency filter → comparison ops; `between` → `gte` + `lte`; a drafting (undefined) value → nothing                                   |
| `to-text-query-filters.util.ts`   | Text filter → `ilike` patterns (`contains`/`startsWith`/`endsWith`), `notIlike` (`notContains`), `eq`/`neq`                                  |
| `to-select-query-filters.util.ts` | Select/multi-select → `in`/`eq`/`neq`; a multi-value `notEquals` expands to an AND of `neq` (NOT IN)                                         |

## Contract notes

- **AND semantics.** `toQueryFilters` flattens per-column results into one array;
  `buildWhereClause` ANDs them, so range (`between`) and multi-value NOT-IN
  filters correctly expand to multiple entries on the same column.
- **Drafting filters yield nothing.** An empty text value or an undefined number
  value maps to `[]` so a half-typed filter never constrains the query.
- **Full operator coverage.** Every table filter operator has a SQL equivalent —
  `notContains` maps to the generic `notIlike` (`NOT ILIKE`) operator; nothing is
  silently dropped.

## What this does NOT do

- No SQL construction — that is `db/query-builder`. These mappers only produce the
  intermediate `QueryFilter[]`.
- No column authorization — identifier safety and `allowedColumns` are enforced
  downstream by the builders (`assertSafeIdentifier` / `assertColumnAllowed`).
