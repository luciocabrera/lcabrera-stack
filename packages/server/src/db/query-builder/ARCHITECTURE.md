# Query Builder Architecture

Generic, schema/table-agnostic Postgres query construction for the common
single-table shapes — reads (flat list view, optional filter/sort/pagination;
count; distinct) and writes (insert/update/delete; max-value) — the pattern
every list/rollup query used to hand-roll per file. Pure
functions only; no DB access lives in this folder (see `@lcabrera/server/db/get-pool.util`
for that) — callers execute the returned `{ text, values }` themselves (or use
the `../*.util.ts` executors that pair each builder with `getPool`).

> **Executing a plain SELECT? Prefer `../select-rows.util.ts`.** It composes
> `buildSelectQuery` with `getPool` so callers don't re-wire the two by hand
> (the Usage example below is exactly what it replaces). Reach for the
> builders directly only when you need the SQL _without_ running it — a count
> paired to a data query, or a shape this folder doesn't build. See
> `../ARCHITECTURE.md` for the pure/impure split.

## Files

| File                                     | Role                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query-builder.types.ts`                 | `ComparisonOperator`, `QueryFilter`, `QuerySort`, `QueryCursor`, `BuiltQuery`, and the `Select`/`Count`/`Distinct`/`Insert`/`Update`/`Delete`/`MaxValue` `…QueryDescriptor` types                                     |
| `quote-identifier.util.ts`               | Safe double-quote identifier escaping                                                                                                                                                                                 |
| `assert-safe-identifier.util.ts`         | **Mandatory**, always called — syntax check (see Security model)                                                                                                                                                      |
| `assert-column-allowed.util.ts`          | **Optional**, opt-in — membership check (see Security model)                                                                                                                                                          |
| `append-filter-clause.util.ts`           | Reducer step used by `buildWhereClause`: one filter → one SQL clause + values                                                                                                                                         |
| `is-unary-filter.util.ts`                | Narrows a filter to the arm that carries no value (`IS NULL` / `IS NOT NULL`) — a predicate, because excluding the operators by literal does not subtract the arm and leaves `filter.value` unresolved                |
| `build-where-clause.util.ts`             | `QueryFilter[]` (plus an optional keyset `cursor`) → `{ text, values }`, correctly incrementing `$n` placeholders                                                                                                     |
| `assert-keyset-cursor.util.ts`           | Refuses a keyset cursor the builder cannot resume correctly — no sort, a tuple that does not match it, or one not ending on a non-null unique column (ADR-052)                                                        |
| `build-keyset-comparison.util.ts`        | The "sorts strictly after this value" half of one keyset branch, for one column, honouring Postgres's default null placement                                                                                          |
| `build-keyset-branch.util.ts`            | One OR-branch: earlier sort columns pinned with `IS NOT DISTINCT FROM`, the column at that position advanced past the cursor                                                                                          |
| `build-keyset-clause.util.ts`            | Composes the branches into the seek predicate `buildWhereClause` ANDs in                                                                                                                                              |
| `build-returning-clause.util.ts`         | Shared `RETURNING` builder for the write builders: `''`, `RETURNING *` (the `['*']` wildcard), or a quoted column projection                                                                                          |
| `build-order-by-clause.util.ts`          | `QuerySort[]` → `ORDER BY ...`                                                                                                                                                                                        |
| `build-optional-numeric-clauses.util.ts` | `LIMIT`/`OFFSET` fragment builder, skips `undefined` values without gapping `$n`                                                                                                                                      |
| `build-select-query.util.ts`             | **Public entry point.** Composes everything above into one `SELECT`                                                                                                                                                   |
| `build-count-query.util.ts`              | `count(<column>)` query sharing `buildWhereClause`'s output, so a data query and its matching count query can never drift apart; `column` defaults to `*`, or names the column to count (e.g. a non-`id` primary key) |
| `build-distinct-query.util.ts`           | **Public entry point.** Paginated `SELECT DISTINCT` for one column (filter-option lists, ADR-009); excludes NULL/empty and orders ascending                                                                           |
| `build-insert-query.util.ts`             | **Public entry point.** `INSERT INTO … (cols) VALUES ($1, …) [RETURNING …]` from a `{ values }` map; keys quoted, values parameterized                                                                                |
| `build-update-query.util.ts`             | **Public entry point.** `UPDATE … SET col = $n WHERE … [RETURNING …]`; reuses `buildWhereClause` with an offset `startParamIndex`, requires ≥1 filter                                                                 |
| `build-delete-query.util.ts`             | **Public entry point.** `DELETE FROM … WHERE … [RETURNING …]`; reuses `buildWhereClause`, requires ≥1 filter                                                                                                          |
| `build-max-value-query.util.ts`          | **Public entry point.** `SELECT COALESCE(MAX(col), 0)` — the generic "next id" read for tables without a sequence/default                                                                                             |

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

**When `allowedColumns` MUST be passed:** the moment any caller lets a
column name come from end-user input (e.g. a `TableLayout`-driven sortable
admin view wired to a URL `?sort=` param) rather than being hardcoded in
TypeScript, that call site must pass `allowedColumns`. The mandatory syntax
check alone is not sufficient once a column name is attacker/user-influenced.
The mechanism already exists — nothing needs to be added to this builder
for that day to come, only remembered at the new call site.

Filter **values** are always parameterized, never string-interpolated,
regardless of `allowedColumns`.

## Pagination: `offset` by default, `cursor` to seek

`buildSelectQuery` paginates with `OFFSET` unless the descriptor carries a
`cursor`, in which case it emits a keyset ("seek") predicate and resumes strictly
after the row that cursor describes — O(limit) rather than O(offset). The
decision, the shape of the predicate and why it is not the compact
`(a, b) > ($1, $2)` row comparison are
[ADR-052](../../../../../docs/decisions/ADR-052-keyset-pagination-for-infinite-scroll.md).

Two things to know before reaching for it:

- **It refuses what it cannot resume.** A cursor needs a total order, so the
  sort must be non-empty, match the tuple one for one, and end on a **non-null**
  unique column — Postgres permits many NULLs in a unique index, so a null there
  is not a total order. Each failure throws at construction time; that the column
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

- No joins, no subqueries, no raw SQL fragments — single table/view only.
  A view that already encodes a join (e.g. `reporting.v_order_totals`)
  is queried as a flat target; this builder doesn't build the join itself.
- No multi-row `INSERT … VALUES (…), (…)`, no `ON CONFLICT`/upsert, no
  `UPDATE … FROM` — the write builders cover the single-row-shaped mutation
  the same way the read builders cover the flat list.
- Not a replacement for every query. Single-scalar aggregates, `EXISTS`
  checks, and DB-function-backed writes are simpler hand-written — forcing
  every query through this builder would be the same mistake as the
  hand-rolled-SQL-everywhere anti-pattern it's meant to fix, just inverted.

## Usage

```ts
import { buildSelectQuery } from '@lcabrera/server/db/query-builder/build-select-query.util';
import { getPool } from '@lcabrera/server/db/get-pool.util';

const { text, values } = buildSelectQuery({
  fields: ['order_id', 'customer_name', 'total_amount'],
  schema: 'reporting',
  sort: [{ column: 'total_amount', direction: 'desc' }],
  table: 'v_order_totals',
});

const result = await getPool().query(text, values);
```

A future caller accepting a column name from a request:

```ts
buildSelectQuery({
  allowedColumns: ['total_amount', 'order_count', 'order_id'],
  fields: [userProvidedSortColumn],
  // ...
});
```
