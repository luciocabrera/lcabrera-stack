# Filters Architecture

The **column-filter contract** between the Table filter UI and the generic
query layer, plus the pure mappers that translate one into the other. Nothing
here touches the database — the mappers produce `QueryFilter[]` values that the
`db/query-builder` builders (and their executors) consume.

The other half of that boundary is where a filter's **options** come from:
`resolve-filter-options-source.util.ts` resolves a request for one column's
distinct values against a caller-supplied source registry, producing the
`allowedColumns` + `columnType` that `db/select-filter-options.util.ts` then
runs on. Also pure, and equally table-agnostic.

## Why it lives in `@lcabrera/server`

The filter _shapes_ describe the Table's per-column filter state — a UI concept
— but they are also the input to the SQL query layer, so they are a **contract**
between the two. Only this side can reach `QueryFilter`, and the dependency may
not run the other way: `@lcabrera/ui` is browser-safe and this package's graph
includes the Postgres driver and `node:crypto`
([ADR-038](../../../../docs/decisions/ADR-038-public-package-topology-by-runtime.md)).

So the shapes are **restated** on each side rather than shared, exactly as
`sort/` restates the request-sort shape
([ADR-039](../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)):
`filters.types.ts` here declares what `toQueryFilters` accepts, and
`packages/ui/src/types/filterOperators.types.ts` declares the Table's own set,
plus the operator aliases and the `{ label, value }` option type that only the
filter UI has any use for. Neither file imports or re-exports the other, and
`@lcabrera/ui` does not list this package as a dependency. Structural typing is
what makes that affordable — a filter built in the Table is assignable here with
no adapter or conversion step.

The two are also not quite the same contract, which is the deeper reason to keep
them apart: the UI's models a filter the user is still _editing_, and this one
models what can be turned into SQL. Two fields here are laxer than a SQL-facing
contract would choose on its own — `NumberFilter.value` admits `undefined` and
`SelectFilter.operator` is optional — because they were authored for a drafting
filter. They stay as they are so the UI's shape remains assignable; tightening
either is a behaviour change for the mappers, not a type-only edit.

## How the two copies stay in step

`apps/react-router/src/routes/enterprise-orders/filterContract.test.ts` is the
guard. It lives in the app because the app is the only thing that legitimately
depends on both packages — integrating them is precisely what the harness is
for.

- **The compile-time half is the call itself.** The fixture is annotated
  `Record<string, ColumnFilter>` using `@lcabrera/ui`'s union and passed to
  `toQueryFilters`, which demands this package's — so the file only compiles
  while the UI's shapes are assignable to these. The annotation is deliberately
  not `satisfies`: `satisfies` would keep each value's narrow literal type and
  check only the filters written down, while the annotation widens them to the
  union, so the whole union is checked. Add an operator to the UI's union and
  leave this one alone, and `vp run typecheck` in `apps/react-router` exits
  non-zero naming that test — and `parseOrdersPageParams`, which puts the same
  assignability on the production path.
- **The runtime half** asserts the `QueryFilter[]` that one filter of each
  variant of the union maps to — variants, not every operator — and that a
  number filter left `undefined` mid-edit maps to no clause at all.

The direction checked is UI → query layer, which is the direction filters
travel. Nothing asserts the reverse, so a variant added _here_ and unused by the
Table is not caught — widen this package's shapes only when the mappers can
honour them.

## Files

| File                                    | Role                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters.types.ts`                      | The discriminated filter shapes: `BooleanFilter`, `DateFilter`, `NumberFilter`, `SelectFilter`, `TextFilter`, and their `ColumnFilter` union         |
| `to-query-filters.util.ts`              | **Entry point.** `Record<column, ColumnFilter>` → flat `QueryFilter[]`; dispatches each column to its per-type mapper                                |
| `to-date-query-filters.util.ts`         | Date filter → `gt`/`lt`/`eq`; `between` → `gte` + `lte` (falls back to `eq` with no upper bound)                                                     |
| `to-number-query-filters.util.ts`       | Number/currency filter → comparison ops; `between` → `gte` + `lte`; a drafting (undefined) value → nothing                                           |
| `to-text-query-filters.util.ts`         | Text filter → `ilike` patterns (`contains`/`startsWith`/`endsWith`), `notIlike` (`notContains`), `eq`/`neq`                                          |
| `to-select-query-filters.util.ts`       | Select/multi-select → `in`/`eq`/`neq`; a multi-value `notEquals` expands to an AND of `neq` (NOT IN)                                                 |
| `resolve-filter-options-source.util.ts` | **Entry point.** A filter-options request + the caller's source registry → the source's `allowedColumns` and the column's `ColumnType`, or a refusal |

## Contract notes

- **AND semantics.** `toQueryFilters` flattens per-column results into one array;
  `buildWhereClause` ANDs them, so range (`between`) and multi-value NOT-IN
  filters correctly expand to multiple entries on the same column.
- **Drafting filters yield nothing.** An empty text value or an undefined number
  value maps to `[]` so a half-typed filter never constrains the query.
- **Full operator coverage.** Every table filter operator has a SQL equivalent —
  `notContains` maps to the generic `notIlike` (`NOT ILIKE`) operator; nothing is
  silently dropped.

## Filter-options sources

`selectFilterOptions` takes `schema` and `table` as data and allow-lists only the
column it is handed, so a consumer serving a generic distinct-values endpoint —
where all three identifiers arrive on a request — has no package-side answer to
_which tables may be asked at all_. Both consumers in this repo had hand-rolled
the same lookup before `resolveFilterOptionsSource` existed.

It takes the registry (`schema.table` → column → `ColumnType`) as an argument:
which sources exist is the consumer's data, the refusal rule is not. It returns
a refusal rather than throwing, and separates an unknown source from an unknown
column, because the two edges answer differently — one maps it to a 400 body,
the other to a typed HTTP error — and neither wants to catch. That refusal is
for the caller's branch, not for the response body: naming which half failed
tells a caller which tables exist.

Both lookups read **own properties only**. A registry is an object literal, so
a request for the column `constructor` otherwise resolves to `Object`'s and the
resolution comes back allowed with a function for a `columnType`.

## What this does NOT do

- No SQL construction — that is `db/query-builder`. These mappers only produce the
  intermediate `QueryFilter[]`.
- No column authorization _for a query_ — identifier safety and `allowedColumns`
  are enforced downstream by the builders (`assertSafeIdentifier` /
  `assertColumnAllowed`). `resolveFilterOptionsSource` sits upstream of that: it
  turns a registry into the `allowedColumns` list the builders then enforce, and
  never decides whether an identifier is safe to emit.
