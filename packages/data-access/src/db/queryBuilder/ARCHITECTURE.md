# Query Builder Architecture

Generic, schema/table-agnostic Postgres query construction for the common
single-table shapes — reads (flat list view, optional filter/sort/pagination;
count; distinct) and writes (insert/update/delete; max-value) — the pattern
every `scan-ingestion` list/rollup query used to hand-roll per file. Pure
functions only; no DB access lives in this folder (see `@repo/data-access/db/getPool.util`
for that) — callers execute the returned `{ text, values }` themselves (or use
the `../*.util.ts` executors that pair each builder with `getPool`).

> **Executing a plain SELECT? Prefer `../selectRows.util.ts`.** It composes
> `buildSelectQuery` with `getPool` so callers don't re-wire the two by hand
> (the Usage example below is exactly what it replaces). Reach for the
> builders directly only when you need the SQL _without_ running it — a count
> paired to a data query, or a shape this folder doesn't build. See
> `../ARCHITECTURE.md` for the pure/impure split.

## Files

| File                                  | Role                                                                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queryBuilder.types.ts`               | `ComparisonOperator`, `QueryFilter`, `QuerySort`, `BuiltQuery`, and the `Select`/`Count`/`Distinct`/`Insert`/`Update`/`Delete`/`MaxValue` `…QueryDescriptor` types                                                    |
| `quoteIdentifier.util.ts`             | Safe double-quote identifier escaping                                                                                                                                                                                 |
| `assertSafeIdentifier.util.ts`        | **Mandatory**, always called — syntax check (see Security model)                                                                                                                                                      |
| `assertColumnAllowed.util.ts`         | **Optional**, opt-in — membership check (see Security model)                                                                                                                                                          |
| `appendFilterClause.util.ts`          | Reducer step used by `buildWhereClause`: one filter → one SQL clause + values                                                                                                                                         |
| `buildWhereClause.util.ts`            | `QueryFilter[]` → `{ text, values }`, correctly incrementing `$n` placeholders                                                                                                                                        |
| `buildReturningClause.util.ts`        | Shared `RETURNING` builder for the write builders: `''`, `RETURNING *` (the `['*']` wildcard), or a quoted column projection                                                                                          |
| `buildOrderByClause.util.ts`          | `QuerySort[]` → `ORDER BY ...`                                                                                                                                                                                        |
| `buildOptionalNumericClauses.util.ts` | `LIMIT`/`OFFSET` fragment builder, skips `undefined` values without gapping `$n`                                                                                                                                      |
| `buildSelectQuery.util.ts`            | **Public entry point.** Composes everything above into one `SELECT`                                                                                                                                                   |
| `buildCountQuery.util.ts`             | `count(<column>)` query sharing `buildWhereClause`'s output, so a data query and its matching count query can never drift apart; `column` defaults to `*`, or names the column to count (e.g. a non-`id` primary key) |
| `buildDistinctQuery.util.ts`          | **Public entry point.** Paginated `SELECT DISTINCT` for one column (filter-option lists, ADR-009); excludes NULL/empty and orders ascending                                                                           |
| `buildInsertQuery.util.ts`            | **Public entry point.** `INSERT INTO … (cols) VALUES ($1, …) [RETURNING …]` from a `{ values }` map; keys quoted, values parameterized                                                                                |
| `buildUpdateQuery.util.ts`            | **Public entry point.** `UPDATE … SET col = $n WHERE … [RETURNING …]`; reuses `buildWhereClause` with an offset `startParamIndex`, requires ≥1 filter                                                                 |
| `buildDeleteQuery.util.ts`            | **Public entry point.** `DELETE FROM … WHERE … [RETURNING …]`; reuses `buildWhereClause`, requires ≥1 filter                                                                                                          |
| `buildMaxValueQuery.util.ts`          | **Public entry point.** `SELECT COALESCE(MAX(col), 0)` — the generic "next id" read for tables without a sequence/default                                                                                             |

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
  A view that already encodes a join (e.g. `llm_usage.v_scanner_llm_cost`)
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
import { buildSelectQuery } from '@repo/data-access/db/queryBuilder/buildSelectQuery.util';
import { getPool } from '@repo/data-access/db/getPool.util';

const { text, values } = buildSelectQuery({
  fields: ['scanner_id', 'display_name', 'total_cost_usd'],
  schema: 'llm_usage',
  sort: [{ column: 'total_cost_usd', direction: 'desc' }],
  table: 'v_scanner_llm_cost',
});

const result = await getPool().query(text, values);
```

A future caller accepting a column name from a request:

```ts
buildSelectQuery({
  allowedColumns: ['total_cost_usd', 'call_count', 'scanner_id'],
  fields: [userProvidedSortColumn],
  // ...
});
```
