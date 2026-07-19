# `src/db/` Architecture

Postgres access for the platform: connection ownership, env validation, query
construction, and query execution.

## The pure/impure boundary

This folder is split deliberately, and the split is the thing to preserve:

| Layer                  | Files                                                                                                                           | Touches the DB?                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Query **construction** | `queryBuilder/` (see its own `ARCHITECTURE.md`)                                                                                 | **No** — pure functions returning `{ text, values }` |
| Query **execution**    | `getPool.util.ts`, `selectRows.util.ts`, `insertRow.util.ts`, `updateRows.util.ts`, `deleteRows.util.ts`, `getMaxValue.util.ts` | **Yes**                                              |
| Configuration          | `env.schema.ts`                                                                                                                 | Reads env only                                       |

`queryBuilder/` is pure so that every SQL string in the repo is testable
without a database — that is why its suite runs in the DB-free coverage job
(ADR-032). Keep it that way: **never import `getPool` from inside
`queryBuilder/`.**

`selectRows` is the sanctioned join between the two halves. Before it existed,
every caller imported `buildSelectQuery` _and_ `getPool` and re-wired the same
four lines by hand — which fallow flagged as a clone group across the
`llm_usage` readers, and which this folder's own docs had enshrined as the
usage example.

## Files

| File                  | Role                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `env.schema.ts`       | Zod schema + `readEnvConfig` for `DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT`/`DB_USER`                   |
| `getPool.util.ts`     | Lazily-initialized `pg.Pool` singleton (one per Node process) + `closePool` for teardown                 |
| `selectRows.util.ts`  | **Public entry point.** Builds a `SelectQueryDescriptor` and executes it on the pool, returning its rows |
| `insertRow.util.ts`   | **Public entry point.** Builds + runs an `InsertQueryDescriptor`; defaults `RETURNING *`, returns rows   |
| `updateRows.util.ts`  | **Public entry point.** Builds + runs an `UpdateQueryDescriptor`; defaults `RETURNING *`, returns rows   |
| `deleteRows.util.ts`  | **Public entry point.** Builds + runs a `DeleteQueryDescriptor`; defaults `RETURNING *`, returns rows    |
| `getMaxValue.util.ts` | **Public entry point.** Runs `buildMaxValueQuery` and returns the numeric `MAX(col)` (0 if empty)        |
| `queryBuilder/`       | Pure SELECT/count/distinct/insert/update/delete/max construction — see `queryBuilder/ARCHITECTURE.md`    |

## Choosing an entry point

- **Reading a flat list/rollup?** Use `selectRows` — it is the whole path.
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
