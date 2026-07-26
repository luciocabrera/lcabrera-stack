# @lcabrera/server

## 0.2.0

### Minor Changes

- c010a6e: Make `SELECT DISTINCT` a generic capability instead of a dropdown-specific one.

  - `SelectQueryDescriptor` gains `distinct?: boolean`, so `buildSelectQuery` / `selectRows` emit `SELECT DISTINCT` over a list of columns with the usual filters/sort/pagination. `buildDistinctQuery` and the new `selectDistinctRows` are thin wrappers over them (kept for readability), no longer locked to a single aliased column.
  - New `isNotNull` comparison operator (`QueryFilter` is now a discriminated union — unary operators carry no value).
  - New `selectFilterOptions` helper: the filter-dropdown specialization built _on top of_ `selectDistinctRows` — one column's distinct, non-empty (empty dropped only for `text` via `ColumnType`), ordered values as a `{ values, hasMore }` page.

  Removes the previous single-purpose `selectDistinctValues` / `buildDistinctValuePredicate` (`buildDistinctQuery` no longer aliases to `value`, bakes in a predicate, or restricts to one column).

- a649b31: Add the `getRowsCount` executor — the count sibling of `getMaxValue`. It runs
  `buildCountQuery` on the pool singleton and returns the matching row count,
  requiring an explicit `column` (typically the primary key) so a total is never
  an ambiguous `count(*)`. Pass it the same `filters`/`allowedColumns` as the data
  query and a page can never drift from its total.
- fbf9d05: Add opt-in keyset ("seek") pagination to the SELECT builder. Pass
  `SelectQueryDescriptor.cursor` — the sort-key tuple of the last row of the
  previous page, plus the column that makes the sort a total order — and
  `buildSelectQuery` resumes strictly after that row in O(limit) instead of walking
  and discarding `offset` rows. Omit it and nothing changes: `OFFSET` remains the
  default, and an offset query's SQL is byte-identical to before.

  The emitted predicate is a NULL-aware lexicographic comparison rather than the
  compact `(a, b) > ($1, $2)` row form, which cannot express mixed sort directions
  and silently stops a scroll at the first NULL in a sortable nullable column. A
  cursor the builder cannot resume correctly — no sort, a tuple that does not match
  it, or one not ending on a non-null unique column — throws at construction time,
  the same posture as refusing an unfiltered UPDATE. See ADR-052.

- 536341c: Harden the persistence layer: typed DB errors, a transaction seam, and a tuned pool.

  **Typed errors (new `./errors/*` subpaths).** `mapDbError` translates a driver
  rejection into `UniqueConstraintViolationError` (`23505`),
  `ForeignKeyViolationError` (`23503`) or `PersistenceError`, all sharing one base
  class so a single `instanceof PersistenceError` catches every translated failure.
  Every executor now applies it, so a `pg` message — which names tables, columns and
  indexes, and whose `detail` line quotes the offending values — no longer escapes
  the package. The original rejection stays on `Error.cause` for server-side logging,
  and `fields.constraint` / `fields.column` / `fields.code` are carried so a consumer
  can route a violation to the right form field. `hasPostgresErrorCode` is exported
  for a SQLSTATE this package does not name.

  **Note for anyone matching on error text:** a rejection from an executor now
  carries our message, not the driver's. Branch on the error type or
  `fields.constraint` instead.

  **Transactions.** `withTransaction({ run })` borrows one pooled connection and
  runs a callback inside BEGIN/COMMIT/ROLLBACK, always releasing it;
  `runInTransaction({ client, run })` does the same over a connection the caller
  owns. A failed ROLLBACK no longer masks the error being unwound. Every executor
  accepts an optional `tx` (`ExecutorOptions` in the new `./db/db.types` subpath) and
  falls back to the pool singleton when it is omitted, so existing callers are
  unchanged.

  **Pool tuning.** `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`, `DB_IDLE_TIMEOUT_MS`
  and `DB_STATEMENT_TIMEOUT_MS` join the shared env schema — optional, coerced, with
  defaults that bound the two cases pg leaves unbounded (connection acquisition and
  statement duration). An environment that predates them boots unchanged.

  See ADR-050 and ADR-051.

## 0.1.1

### Patch Changes

- 287eb48: Add and update package READMEs.

  npm renders `README.md` as the package page, and `@lcabrera/api`,
  `@lcabrera/server` and `@lcabrera/ui` had none — all three pages were empty. Each
  now covers what the package is, how to install it, every subpath export, and
  worked examples.

  `@lcabrera/ui`'s leads with the constraint a consumer hits first: it ships
  TypeScript source rather than a compiled bundle, so the bundler must compile it
  and run StyleX over it.

  `@lcabrera/utils`'s install step told readers to use `workspace:*`, which only
  resolves inside this repo; its export table had also drifted four entries behind
  the `exports` map.

  A README only reaches npm with a release, so this is a patch across all four.

## 0.1.0

### Minor Changes

- First public release.

  `@lcabrera/ui` ships React 19 components — Table, Form, Modal, Tooltip and the
  rest — styled with StyleX and built for React Router 7 loaders and actions.
  `@lcabrera/api` is the browser-safe fetch layer, `@lcabrera/server` the Node-only
  Postgres and crypto helpers, and `@lcabrera/utils` the pure helpers underneath
  both.

  These target one stack deliberately: React 19, React Router 7, StyleX, the React
  Compiler, and `pg` on the server. They are not framework-agnostic and do not try
  to be.

  `api`, `server` and `utils` are published as compiled `dist` with type
  declarations. `ui` ships TypeScript source on purpose — StyleX derives every
  custom-property name from the source path, so a consumer's own StyleX plugin has
  to compile it.
