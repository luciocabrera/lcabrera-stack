# `src/db/` Architecture

Postgres access for the platform: connection ownership, env validation, query
construction, and query execution.

## The pure/impure boundary

This folder is split deliberately, and the split is the thing to preserve:

| Layer                  | Files                                                                                                                                                                                                                             | Touches the DB?                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Query **construction** | `query-builder/` (see its own `ARCHITECTURE.md`)                                                                                                                                                                                  | **No** — pure functions returning `{ text, values }` |
| Query **execution**    | `get-pool.util.ts`, `select-rows.util.ts`, `select-distinct-rows.util.ts`, `select-filter-options.util.ts`, `insert-row.util.ts`, `update-rows.util.ts`, `delete-rows.util.ts`, `get-max-value.util.ts`, `get-rows-count.util.ts` | **Yes**                                              |
| Configuration          | `env.schema.ts`                                                                                                                                                                                                                   | Reads env only                                       |

`query-builder/` is pure so that every SQL string in the repo is testable
without a database — that is why its suite runs in the DB-free coverage job
(ADR-032). Keep it that way: **never import `getPool` from inside
`query-builder/`.**

`selectRows` is the sanctioned join between the two halves. Before it existed,
every caller imported `buildSelectQuery` _and_ `getPool` and re-wired the same
four lines by hand — which fallow flagged as a clone group across the
`llm_usage` readers, and which this folder's own docs had enshrined as the
usage example. `selectDistinctRows` is its `SELECT DISTINCT` sibling — a
one-line wrapper so the two never drift. `selectFilterOptions` composes _that_
into the one specialization worth naming: the filter-dropdown read (one column's
distinct, non-empty, ordered values as a `{ values, hasMore }` page). Keep that
split — the generic builders/executors take a list of columns and stay unaware of
dropdowns; the dropdown shaping lives only in `selectFilterOptions`.

## Files

| File                            | Role                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `env.schema.ts`                 | Zod schema + `readEnvConfig` for `DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT`/`DB_USER`                                                                           |
| `get-pool.util.ts`              | Lazily-initialized `pg.Pool` singleton (one per Node process) + `closePool` for teardown                                                                         |
| `select-rows.util.ts`           | **Public entry point.** Builds a `SelectQueryDescriptor` and executes it on the pool, returning its rows                                                         |
| `select-distinct-rows.util.ts`  | **Public entry point.** `selectRows` + `distinct: true` — deduplicated rows over the same descriptor                                                             |
| `select-filter-options.util.ts` | **Public entry point.** Filter-dropdown specialization over `selectDistinctRows`: one column's distinct, non-empty, ordered values → `{ values, hasMore }`       |
| `insert-row.util.ts`            | **Public entry point.** Builds + runs an `InsertQueryDescriptor`; defaults `RETURNING *`, returns rows                                                           |
| `update-rows.util.ts`           | **Public entry point.** Builds + runs an `UpdateQueryDescriptor`; defaults `RETURNING *`, returns rows                                                           |
| `delete-rows.util.ts`           | **Public entry point.** Builds + runs a `DeleteQueryDescriptor`; defaults `RETURNING *`, returns rows                                                            |
| `get-max-value.util.ts`         | **Public entry point.** Runs `buildMaxValueQuery` and returns the numeric `MAX(col)` (0 if empty)                                                                |
| `get-rows-count.util.ts`        | **Public entry point.** Runs `buildCountQuery` and returns the row count; requires an explicit `column` (never `count(*)`) so a page and its total share filters |
| `query-builder/`                | Pure SELECT/count/distinct/insert/update/delete/max construction — see `query-builder/ARCHITECTURE.md`                                                           |

## Choosing an entry point

- **Reading a flat list/rollup?** Use `selectRows` — it is the whole path.
- **Counting rows for that same read** (pagination totals)? Use `getRowsCount`
  with the data query's `filters`/`allowedColumns` and an explicit primary-key
  `column`, so the page and its total can never drift.
- **Reading _distinct_ rows** over a list of columns? Use `selectDistinctRows`
  (or `selectRows`/`buildSelectQuery` with `distinct: true`) — same descriptor,
  deduplicated.
- **Populating a filter dropdown** (one column's distinct values)? Use
  `selectFilterOptions` — pass the column's `columnType` so only `text` columns
  also drop the empty string. It composes `selectDistinctRows`; do not
  re-specialize the generic builder for this.
- **Writing a single-row-shaped mutation?** Use `insertRow`/`updateRows`/
  `deleteRows` — each pairs its builder with `getPool` and defaults to
  `RETURNING *`, so the affected row(s) come back. `getMaxValue` is the
  companion "next id" read for tables without a sequence.
- **Need the SQL without running it** (a count paired to a data query, a
  DB-function call, an `EXISTS` check)? Use `buildSelectQuery`/
  `buildCountQuery`/`buildDistinctQuery`/`buildInsertQuery`/`buildUpdateQuery`/
  `buildDeleteQuery`/`buildMaxValueQuery` and run it yourself via `getPool`.
- **Anything the builders do not cover** (joins, multi-row inserts, upserts,
  single-scalar aggregates) stays hand-written SQL through `getPool` — forcing
  every query through the builder is the hand-rolled-SQL anti-pattern inverted.

## Row types are a contract, not a guarantee

`selectRows<TRow>` does not validate the row against the view — pg cannot.
Two consequences worth remembering:

- `numeric` columns arrive as **strings**. Type them `string` and coerce at
  the caller (see `scan-ingestion`'s `selectLlmCostRows.util.ts`, which does it
  once for all three `llm_usage` cost readers).
- A `TRow` that disagrees with the view fails at runtime, not compile time.
