# `src/db/` Architecture

Postgres access for the platform: connection ownership, env validation, query
construction, and query execution.

## The pure/impure boundary

This folder is split deliberately, and the split is the thing to preserve:

| Layer                  | Files                                                                                                                                                                                                                                                                                                                             | Touches the DB?                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Query **construction** | `query-builder/` and `group-query-builder/` (each has its own `ARCHITECTURE.md`)                                                                                                                                                                                                                                                  | **No** — pure functions returning `{ text, values }` |
| Query **execution**    | `get-pool.util.ts`, `run-query.util.ts`, `select-rows.util.ts`, `select-grouped-rows.util.ts`, `select-distinct-rows.util.ts`, `select-filter-options.util.ts`, `insert-row.util.ts`, `update-rows.util.ts`, `delete-rows.util.ts`, `get-max-value.util.ts`, `get-rows-count.util.ts`, `get-column-grouping-capabilities.util.ts` | **Yes**                                              |
| **Transactions**       | `with-transaction.util.ts`, `run-in-transaction.util.ts`, `rollback-transaction.util.ts`                                                                                                                                                                                                                                          | **Yes**                                              |
| Configuration          | `env.schema.ts`, `db.types.ts`                                                                                                                                                                                                                                                                                                    | Reads env only                                       |

`query-builder/` and `group-query-builder/` are pure so that every SQL string in
the repo is testable without a database — that is why its suite runs in the DB-free coverage job
(ADR-032). Keep it that way: **never import `getPool` from inside either
builder folder.**

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

## One connection seam, one translation point

No executor calls `getPool().query` any more; they all go through
`run-query.util.ts`, which does exactly two things neither of them may forget:

1. **Picks the connection** — the caller's `tx` when there is one, the pool
   singleton otherwise ([ADR-051](../../../../docs/decisions/ADR-051-with-transaction-and-tx-executor-option.md)).
2. **Translates the rejection** through `mapDbError`, so a raw `pg` message never
   escapes this package ([ADR-050](../../../../docs/decisions/ADR-050-server-error-translation-and-result-contract.md)).

Six executors each owning their own copy of both is six chances to omit one, and
the reads had already omitted the second.

The trap to know: an executor called **without** `tx` inside a `withTransaction`
block runs on a different connection, outside that transaction, and commits on its
own. Nothing detects it — thread `tx` through every step that must be atomic.

## Files

| File                                       | Role                                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `env.schema.ts`                            | Zod schema + `readEnvConfig` for the `DB_*` credentials and the four optional pool-tuning keys                                                                                                   |
| `db.types.ts`                              | `ExecutorOptions` (the optional `tx`) + `TransactionClient` — kept out of `query-builder/`, which must not know about connections                                                                |
| `get-pool.util.ts`                         | Lazily-initialized `pg.Pool` singleton (one per Node process) + `closePool` for teardown                                                                                                         |
| `run-query.util.ts`                        | Private. The one place a built query meets a connection: resolves `tx`-or-pool and translates the rejection                                                                                      |
| `with-transaction.util.ts`                 | **Public entry point.** Borrows a pooled connection, runs a callback in BEGIN/COMMIT/ROLLBACK, always releases                                                                                   |
| `run-in-transaction.util.ts`               | **Public entry point.** The same, over a connection the caller owns; opens and closes nothing                                                                                                    |
| `rollback-transaction.util.ts`             | Private. ROLLBACK that swallows its own failure so it cannot mask the error being unwound                                                                                                        |
| `select-rows.util.ts`                      | **Public entry point.** Builds a `SelectQueryDescriptor` and executes it on the pool, returning its rows                                                                                         |
| `select-distinct-rows.util.ts`             | **Public entry point.** `selectRows` + `distinct: true` — deduplicated rows over the same descriptor                                                                                             |
| `select-grouped-rows.util.ts`              | **Public entry point.** Resolves the columns' grouping capabilities, builds the `GROUPING SETS` query from that answer, runs it, and returns the rows beside the aliases they must be decoded by |
| `select-filter-options.util.ts`            | **Public entry point.** Filter-dropdown specialization over `selectDistinctRows`: one column's distinct, non-empty, ordered values → `{ values, hasMore }`                                       |
| `insert-row.util.ts`                       | **Public entry point.** Builds + runs an `InsertQueryDescriptor`; defaults `RETURNING *`, returns rows                                                                                           |
| `update-rows.util.ts`                      | **Public entry point.** Builds + runs an `UpdateQueryDescriptor`; defaults `RETURNING *`, returns rows                                                                                           |
| `delete-rows.util.ts`                      | **Public entry point.** Builds + runs a `DeleteQueryDescriptor`; defaults `RETURNING *`, returns rows                                                                                            |
| `get-max-value.util.ts`                    | **Public entry point.** Runs `buildMaxValueQuery` and returns the numeric `MAX(col)` (0 if empty)                                                                                                |
| `get-column-grouping-capabilities.util.ts` | **Public entry point.** One catalogue round trip resolving, per column, whether it may be a group key (and why not) and which aggregates are legal                                               |
| `get-rows-count.util.ts`                   | **Public entry point.** Runs `buildCountQuery` and returns the row count; requires an explicit `column` (never `count(*)`) so a page and its total share filters                                 |
| `query-builder/`                           | Pure SELECT/count/distinct/insert/update/delete/max construction — see `query-builder/ARCHITECTURE.md`                                                                                           |
| `group-query-builder/`                     | Pure grouped-read construction and the ADR-058 legality gates — see `group-query-builder/ARCHITECTURE.md`                                                                                        |

## Choosing an entry point

- **Reading a flat list/rollup?** Use `selectRows` — it is the whole path.
- **Reading a _grouped_ result?** Use `selectGroupedRows`. Do not call
  `buildGroupQuery` yourself: it is pure and needs the catalogue's capability
  answer, and a caller assembling that map by hand is a caller who can defeat
  ADR-058's gates. It returns `aggregates`/`keys`/`maskAlias` beside the rows
  because a grouped row cannot be decoded without them — an aggregate's alias is
  derived, and the mask's bit positions are relative to the key order.
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
  `deleteRows` — each pairs its builder with `runQuery` and defaults to
  `RETURNING *`, so the affected row(s) come back. `getMaxValue` is the
  companion "next id" read for tables without a sequence.
- **Several writes that must all land or none?** Wrap them in `withTransaction`
  and pass its `tx` to each executor. `runInTransaction` is the variant for a
  connection you opened yourself. A transaction narrows a read-then-write race
  but does not close one — ADR-051 has the locking/retry decision.
- **Need the SQL without running it** (a count paired to a data query, a
  DB-function call, an `EXISTS` check)? Use `buildSelectQuery`/
  `buildCountQuery`/`buildDistinctQuery`/`buildInsertQuery`/`buildUpdateQuery`/
  `buildDeleteQuery`/`buildMaxValueQuery` and run it yourself via `getPool` —
  and wrap the call in `mapDbError`, or you reintroduce the raw-message leak the
  executors close.
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
