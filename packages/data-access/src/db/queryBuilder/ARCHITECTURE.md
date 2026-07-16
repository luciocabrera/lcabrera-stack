# Query Builder Architecture

Generic, schema/table-agnostic Postgres query construction for the "flat
list view, optional filter/sort/pagination" shape — the pattern every
`scan-ingestion` list/rollup query used to hand-roll per file. Pure
functions only; no DB access lives in this folder (see `@repo/data-access/db/getPool.util`
for that) — callers execute the returned `{ text, values }` themselves.

> **Executing a plain SELECT? Prefer `../selectRows.util.ts`.** It composes
> `buildSelectQuery` with `getPool` so callers don't re-wire the two by hand
> (the Usage example below is exactly what it replaces). Reach for the
> builders directly only when you need the SQL _without_ running it — a count
> paired to a data query, or a shape this folder doesn't build. See
> `../ARCHITECTURE.md` for the pure/impure split.

## Files

| File                                  | Role                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `QueryBuilder.types.ts`               | `ComparisonOperator`, `QueryFilter`, `QuerySort`, `SelectQueryDescriptor`, `CountQueryDescriptor`, `DistinctQueryDescriptor`, `BuiltQuery`  |
| `quoteIdentifier.util.ts`             | Safe double-quote identifier escaping                                                                                                       |
| `assertSafeIdentifier.util.ts`        | **Mandatory**, always called — syntax check (see Security model)                                                                            |
| `assertColumnAllowed.util.ts`         | **Optional**, opt-in — membership check (see Security model)                                                                                |
| `appendFilterClause.util.ts`          | Reducer step used by `buildWhereClause`: one filter → one SQL clause + values                                                               |
| `buildWhereClause.util.ts`            | `QueryFilter[]` → `{ text, values }`, correctly incrementing `$n` placeholders                                                              |
| `buildOrderByClause.util.ts`          | `QuerySort[]` → `ORDER BY ...`                                                                                                              |
| `buildOptionalNumericClauses.util.ts` | `LIMIT`/`OFFSET` fragment builder, skips `undefined` values without gapping `$n`                                                            |
| `buildSelectQuery.util.ts`            | **Public entry point.** Composes everything above into one `SELECT`                                                                         |
| `buildCountQuery.util.ts`             | `count(id)` query sharing `buildWhereClause`'s output, so a data query and its matching count query can never drift apart                   |
| `buildDistinctQuery.util.ts`          | **Public entry point.** Paginated `SELECT DISTINCT` for one column (filter-option lists, ADR-009); excludes NULL/empty and orders ascending |

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

## What this does NOT do

- No joins, no subqueries, no raw SQL fragments — single table/view only.
  A view that already encodes a join (e.g. `llm_usage.v_scanner_llm_cost`)
  is queried as a flat target; this builder doesn't build the join itself.
- No write mutations (`INSERT`/`UPDATE`/`DELETE`) — read-side only.
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
