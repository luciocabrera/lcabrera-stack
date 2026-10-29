# Query Builder Architecture

Generic, schema/table-agnostic Postgres query construction for the common
shapes — reads (rows with optional filter/sort/pagination, a count, a distinct
projection, and a grouped aggregate read, any of them joined along a declared
foreign key) and single-table writes
(insert/update/delete; max-value). Pure functions only; no DB access lives in
this folder (see `@lcabrera/server/db/get-pool.util` for that) — callers
execute the returned `{ text, values }` themselves, or use the `../*.util.ts`
executors that pair a read or a write with `getPool`.

## The query entry point

**`build-read-query.util.ts` is the query entry point.** `buildReadQuery` takes
one descriptor carrying every dimension of a read — `fields`, `filters`, `sort`,
pagination (`limit`/`offset`, or a keyset `cursor`), `distinct`, and for an
aggregate read `aggregates`, `grouping`, `keys` and the rest of a
`GroupQueryDescriptor` — and returns the query. Which SQL shape it emits follows
from the descriptor, not from the function you picked:

| Descriptor carries | Emits                                                                                            | Returns           |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------- |
| `grouping`         | `GROUP BY GROUPING SETS` with a `GROUPING()` mask (see `../group-query-builder/ARCHITECTURE.md`) | `BuiltGroupQuery` |
| `count: true`      | `count(<column>)` over the same `WHERE` a row read gets                                          | `BuiltQuery`      |
| neither            | `SELECT [DISTINCT] fields …`                                                                     | `BuiltQuery`      |

The return type follows the descriptor, so a grouped read is typed with the
keys and masks its rows are decoded by without a narrowing step. The three
shapes refuse each other's fields at the type level: a grouped read takes no
`limit`, `offset`, `cursor` or `fields`, because it is never paginated and its
projection is its keys and aggregates.

A grouped read still needs the `capabilities` map the catalogue answers, which
takes a round trip; resolve it with `getColumnGroupingCapabilities`, or let the
`selectGroupedRows` executor do both.

`buildSelectQuery`, `buildDistinctQuery` and `buildCountQuery` here, and
`buildGroupQuery` in `../group-query-builder/`, remain exported for existing
callers. Each is `@deprecated` and calls the private builder for its own shape
directly, without dispatching. A descriptor carrying another shape's field is
built as the old builder's shape, as it was before the entry point existed.

## Files

| File                                        | Role                                                                                                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query-builder.types.ts`                    | `ComparisonOperator`, `QueryFilter`, `QuerySort`, `QueryCursor`, `BuiltQuery`, the `Select`/`Count`/`Insert`/`Update`/`Delete`/`MaxValue` `…QueryDescriptor` types, and the read union `ReadQueryDescriptor` with `BuiltReadQuery`     |
| `quote-identifier.util.ts`                  | Safe double-quote identifier escaping                                                                                                                                                                                                  |
| `assert-safe-identifier.util.ts`            | **Mandatory**, always called — syntax check (see Security model)                                                                                                                                                                       |
| `assert-column-allowed.util.ts`             | **Optional**, opt-in — membership check (see Security model)                                                                                                                                                                           |
| `append-filter-clause.util.ts`              | Reducer step used by `buildWhereClause`: one filter → one SQL clause + values                                                                                                                                                          |
| `is-unary-filter.util.ts`                   | Narrows a filter to the arm that carries no value (`IS NULL` / `IS NOT NULL`) — a predicate, because excluding the operators by literal does not subtract the arm and leaves `filter.value` unresolved                                 |
| `build-where-clause.util.ts`                | `QueryFilter[]` (plus an optional keyset `cursor`) → `{ text, values }`, correctly incrementing `$n` placeholders                                                                                                                      |
| `assert-keyset-cursor.util.ts`              | Refuses a keyset cursor the builder cannot resume correctly — no sort, a tuple that does not match it, or one not ending on a non-null unique column (ADR-052)                                                                         |
| `build-keyset-comparison.util.ts`           | The "sorts strictly after this value" half of one keyset branch, for one column, honouring Postgres's default null placement                                                                                                           |
| `build-keyset-branch.util.ts`               | One OR-branch: earlier sort columns pinned with `IS NOT DISTINCT FROM`, the column at that position advanced past the cursor                                                                                                           |
| `build-keyset-clause.util.ts`               | Composes the branches into the seek predicate `buildWhereClause` ANDs in                                                                                                                                                               |
| `build-returning-clause.util.ts`            | Shared `RETURNING` builder for the write builders: `''`, `RETURNING *` (the `['*']` wildcard), or a quoted column projection                                                                                                           |
| `build-order-by-clause.util.ts`             | `QuerySort[]` → `ORDER BY ...`                                                                                                                                                                                                         |
| `build-optional-numeric-clauses.util.ts`    | `LIMIT`/`OFFSET` fragment builder, skips `undefined` values without gapping `$n`                                                                                                                                                       |
| `build-read-query.util.ts`                  | **The query entry point.** One `ReadQueryDescriptor` → a row, count or grouped read                                                                                                                                                    |
| `build-rows-read.util.ts`                   | Private. Composes the clauses above into one `SELECT [DISTINCT]`                                                                                                                                                                       |
| `build-count-read.util.ts`                  | Private. `count(<column>)` sharing `buildWhereClause`'s output, so a row read and its count cannot drift apart; `column` defaults to `*`                                                                                               |
| `build-select-query.util.ts`                | Deprecated. Calls `buildRowsRead`                                                                                                                                                                                                      |
| `build-count-query.util.ts`                 | Deprecated. Calls `buildCountRead`                                                                                                                                                                                                     |
| `build-distinct-query.util.ts`              | Deprecated. Calls `buildRowsRead` with `distinct: true`                                                                                                                                                                                |
| `build-insert-query.util.ts`                | Write builder. `INSERT INTO … (cols) VALUES ($1, …) [RETURNING …]` from a `{ values }` map; keys quoted, values parameterized                                                                                                          |
| `build-update-query.util.ts`                | Write builder. `UPDATE … SET col = $n WHERE … [RETURNING …]`; reuses `buildWhereClause` with an offset `startParamIndex`, requires ≥1 filter                                                                                           |
| `build-delete-query.util.ts`                | Write builder. `DELETE FROM … WHERE … [RETURNING …]`; reuses `buildWhereClause`, requires ≥1 filter                                                                                                                                    |
| `resolve-read-scope.util.ts`                | Turns a read's `joins` into the `FROM` list and one source per alias, refusing a join without the base `allowedColumns`, without `relations`, with a taken alias, a kind other than `inner`/`left`, or a start that is not yet reached |
| `resolve-join-relation.util.ts`             | Finds the one foreign key on the source table whose referencing columns are the ones a join names; refuses none, more than one, or an unsafe target                                                                                    |
| `build-join-clause.util.ts`                 | `INNER`/`LEFT JOIN … AS "<alias>" ON` one quoted equality per column pair of that foreign key — no caller text                                                                                                                         |
| `resolve-column-reference.util.ts`          | A bare string or a `{ column, source }` → its projected name and its qualified SQL, after `assertSafeIdentifier` and `assertColumnAllowed` against **its own source's** list                                                           |
| `build-projected-column.util.ts`            | `"<alias>"."<column>" AS "<alias>.<column>"`, refusing a projected alias past 63 bytes rather than letting Postgres truncate it                                                                                                        |
| `to-column-name.util.ts`                    | A reference's projected name: the column, or `<alias>.<column>`                                                                                                                                                                        |
| `is-same-column-reference.util.ts`          | Whether two references name the same column of the same source; a dotted string never equals a joined reference                                                                                                                        |
| `append-comparison-clause.util.ts`          | One operator applied to an already-rendered term; shared by a `WHERE` filter and a grouped `HAVING` filter                                                                                                                             |
| `build-foreign-key-relations-query.util.ts` | The catalogue query `getForeignKeyRelations` runs: every `pg_constraint` foreign key reachable from the base target within the join depth, with both column lists in constraint order                                                  |
| `build-max-value-query.util.ts`             | Write-path read. `SELECT COALESCE(MAX(col), 0)` — the generic "next id" read for tables without a sequence/default                                                                                                                     |

## The null tests are unary, and both directions exist

`isNull` and `isNotNull` stand alone and take no value, where every other
operator carries one. That is forced by SQL's three-valued logic rather than
being a spelling preference: `col = NULL` is not false, it is _unknown_, so it
never matches — not even the rows that are null. A filter meaning "this column
is null" cannot be written as an equality at all.

Two properties are easy to break and are each pinned by a test:

- **A unary clause consumes no `$n` slot.** Advancing `paramIndex` for one would
  shift every later filter's placeholder off its value, producing a query that
  runs and compares the wrong columns.
- **The two are not interchangeable.** They select disjoint row sets, so a
  copy-paste emitting one for the other passes any check that only asserts "a
  clause was appended".

`isNull` was added for the group drill (ADR-079): a group row whose key is NULL
is a real group, and it is the one a user is most likely to click into, so the
equality spelling fails silently on the most-clicked case — it returns an empty
page rather than an error.

## Security model — read this before adding a call site

Identifiers (schema/table/column names) can never be sent as parameterized
`$1, $2, ...` values — a Postgres protocol limitation, not a design choice —
so whatever string lands in an identifier position goes into the query text
itself. Two checks apply, one mandatory and one opt-in:

1. **`assertSafeIdentifier` — mandatory, always runs, no caller opt-out.**
   Every schema/table/column identifier is checked against `^[a-z_][a-z0-9_]*$`
   (rejects `*`, `;`, whitespace, quotes, comments, etc.). This is a safety
   floor even if a caller forgets everything else.
2. **`assertColumnAllowed` via `allowedColumns` — optional, opt-in per call.**
   When a caller passes `allowedColumns`, every `fields`/filter/sort column
   must additionally be a member of that list. This is the actual
   _authorization_ check ("which columns this specific query permits"),
   which a syntax check alone cannot express — a regex can't stop a
   syntactically valid but unintended column (e.g. an internal column
   nobody meant to expose) from being selected, sorted, or filtered on.
   A column outside the list throws `QueryRefusedError` (reason
   `column-not-allowed`), which is what lets an edge answer a refused request
   differently from a server fault.

**When `allowedColumns` MUST be passed:** the moment any caller lets a
column name come from end-user input (e.g. a `TableLayout`-driven sortable
admin view wired to a URL `?sort=` param) rather than being hardcoded in
TypeScript, that call site must pass `allowedColumns`. The mandatory syntax
check alone is not sufficient once a column name is attacker/user-influenced.
The mechanism already exists — nothing needs to be added to this builder
for that day to come, only remembered at the new call site.

Filter **values** are always parameterized, never string-interpolated,
regardless of `allowedColumns`.

### A join widens what a read reaches, so it narrows what it may name

[ADR-143](../../../../../docs/decisions/ADR-143-join-along-a-foreign-key-and-filter-a-flat-grouped-result.md)
is the decision. What it means for a call site:

- **A join follows a declared foreign key, many-to-one.** The descriptor names
  only the referencing columns, on the base target or an earlier join. The
  target table and its referenced columns come from the `relations` map, which
  the executors read with `getForeignKeyRelations` and a pure caller passes in.
  A foreign key always references a primary or unique key, so a join adds
  columns to a row and never repeats one; a count, a keyset page and an
  aggregate over the join stay correct.
- **Every source has its own allowlist, and it is required.** Once a read has a
  join, the base `allowedColumns` is required on every shape, and each join
  carries its own. A `{ column, source }` reference is checked against its
  source's list only, so a name allowed on one table is not allowed on another.
  The foreign-key columns a join is named by are checked the same way.
- **The SQL is the builder's alone.** The `ON` clause is one quoted equality
  per column pair; every column is qualified once the read joins; a joined
  column is projected as `"<alias>.<column>"`, which no safe identifier can
  collide with. An alias that would pass Postgres's 63-byte identifier limit is
  refused rather than truncated.
- **A keyset cursor rests on the base target.** Its `uniqueColumn` is a bare
  string, because a joined column repeats across the base rows that reference
  it. Earlier sort entries may still name a joined column.
- **A grouped read over a join** takes its `capabilities` and `periods` keyed by
  the projected name, `<alias>.<column>`; `selectGroupedRows` resolves them per
  source table.

### A filter on a grouped result

`groupFilters` emits `HAVING`. Each entry names an aggregate alias the same
descriptor declares, a comparison operator (not `ilike`/`notIlike`) and a
value, which is parameterized. Postgres does not let `HAVING` name an output
alias, so the builder writes the aggregate's expression again, its own
`FILTER` included, reusing that filter's parameters. It is refused with
`rollup` or `cube`, where `HAVING` would also test the subtotals, and with a
`columnAxis`, where one alias stands for one expression per axis value.

## Pagination: `offset` by default, `cursor` to seek

A row read paginates with `OFFSET` unless the descriptor carries a
`cursor`, in which case it emits a keyset ("seek") predicate and resumes strictly
after the row that cursor describes — O(limit) rather than O(offset). The
decision, the shape of the predicate and why it is not the compact
`(a, b) > ($1, $2)` row comparison are
[ADR-052](../../../../../docs/decisions/ADR-052-keyset-pagination-for-infinite-scroll.md).

Two things to know before reaching for it:

- **It refuses what it cannot resume.** A cursor needs a total order, so the
  sort must be non-empty, match the tuple one for one, and end on a **non-null**
  unique column — Postgres permits many NULLs in a unique index, so a null there
  is not a total order. Each failure throws a `QueryRefusedError` at
  construction time, with a `keyset-*` reason; that the column
  really is unique stays the caller's to guarantee, like `allowedColumns`.
- **Pass one or the other.** A `cursor` and an `offset` together are accepted and
  mean what they say — skip `n` rows _after_ the cursor — which is almost never
  what a caller wants.

## Mutation safety

The write builders carry one extra guard the reads don't need: `buildUpdateQuery`
and `buildDeleteQuery` **require at least one filter** and throw otherwise. An
unfiltered `UPDATE`/`DELETE` rewrites or empties the whole table, so it is refused
at construction time — a caller that genuinely wants every row must say so with an
explicit always-true filter, never by omission. `RETURNING` is delegated to the
shared `buildReturningClause`; the executors default it to `RETURNING *` so the
affected row(s) come back without the caller enumerating columns (`*` is a fixed
SQL token, never routed through identifier checks; an explicit column list still
is).

## What this does NOT do

- No join other than many-to-one along a foreign key the catalogue declares:
  no one-to-many direction, no `RIGHT`, `FULL` or `CROSS` join, no condition
  other than key equality. A relation the schema does not declare is still a
  view, read as a flat target.
- No filter on a `rollup`, `cube` or column-axis grouped result. `groupFilters`
  covers a flat grouped read only.
- No subqueries, no common table expressions, no window functions, no raw SQL
  fragments.
- No multi-row `INSERT … VALUES (…), (…)`, no `ON CONFLICT`/upsert, no
  `UPDATE … FROM` — the write builders cover the single-row-shaped mutation
  the same way the read builders cover the flat list.
- Not a replacement for every query. Single-scalar aggregates, `EXISTS`
  checks, and DB-function-backed writes are simpler hand-written — forcing
  every query through this builder would be the same mistake as the
  hand-rolled-SQL-everywhere anti-pattern it's meant to fix, just inverted.

## Usage

```ts
import { buildReadQuery } from '@lcabrera/server/db/query-builder/build-read-query.util';

const page = buildReadQuery({
  allowedColumns: ['id', 'region', 'amount'],
  fields: ['id', 'region', 'amount'],
  filters: [{ column: 'region', operator: 'eq', value: 'north' }],
  limit: 50,
  schema: 'catalog',
  sort: [{ column: 'amount', direction: 'desc' }],
  table: 'items',
});

const total = buildReadQuery({
  allowedColumns: ['id', 'region'],
  column: 'id',
  count: true,
  filters: [{ column: 'region', operator: 'eq', value: 'north' }],
  schema: 'catalog',
  table: 'items',
});

const grouped = buildReadQuery({
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: ['region', 'status', 'amount'],
  capabilities,
  filters: [{ column: 'status', operator: 'eq', value: 'open' }],
  grouping: 'rollup',
  keys: ['region', 'status'],
  maxRows: 5000,
  schema: 'catalog',
  sort: [{ aggregateAlias: 'sum_amount', direction: 'desc' }],
  table: 'items',
});

const joined = buildReadQuery({
  allowedColumns: ['id', 'vendor_id', 'amount'],
  fields: ['id', 'amount', { column: 'name', source: 'vendor' }],
  joins: [
    {
      alias: 'vendor',
      allowedColumns: ['name'],
      foreignKey: ['vendor_id'],
      kind: 'inner',
    },
  ],
  relations,
  schema: 'catalog',
  sort: [{ column: 'id', direction: 'asc' }],
  table: 'items',
});

const busy = buildReadQuery({
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: ['region', 'amount'],
  capabilities,
  groupFilters: [{ aggregateAlias: 'sum_amount', operator: 'gt', value: 1000 }],
  grouping: 'flat',
  keys: ['region'],
  maxRows: 5000,
  schema: 'catalog',
  table: 'items',
});
```

Pass `allowedColumns` whenever a column name arrives on a request; the
Security model above applies to every shape the entry point emits.
