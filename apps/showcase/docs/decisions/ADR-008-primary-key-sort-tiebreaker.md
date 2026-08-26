# ADR-008: Columns-Derived Primary Key & Sort Tiebreaker

**Status:** Accepted

## Context

Server-paginated tables must produce a deterministic row ordering. When the sort
keys the server receives are not unique (e.g. sorting only by `order_status`),
offset pagination (`limit`/`skip`) can return duplicated or skipped rows across
pages because the database is free to order ties arbitrarily between requests.
The table had no mechanism to guarantee a stable ordering, so pagination could
be subtly inconsistent under non-unique sorts.

Separately, the CRUD row actions (`view`, `edit`, `delete`) resolved the row id
through a `crud.idAccessor` (a column key **or** an arbitrary resolver
function). This conflated two concerns in the `crud` config: the _operations_
allowed (create/read/update/delete) and _how a row is identified_. It also
diverged from how a real database models a table — where the primary key is a
property of the columns themselves.

## Decision

Model the table like a Postgres table: the **primary key is a property of the
columns**.

1. **`isPrimaryKey` on `TableColumn`** — one or more columns may be flagged. The
   ordered set of flagged columns is the table's primary key.
2. **`TableCrudConfig` is now only DB operation flags** — `{ create?, read?,
update?, delete? }`. It is non-generic (no longer parameterised by `TData`).
3. **`idAccessor` / `TableCrudIdAccessor` removed** — the row id is derived from
   the primary-key column(s) via `resolveCrudRowId({ columns, row })`. A single
   primary key yields the raw (URL-encoded) value; a composite key joins each
   encoded value with `PRIMARY_KEY_ID_DELIMITER` (`_`) in declaration order.
4. **`deleteActionPath` moved out of `crud`** into `TableMetaState.deleteActionPath`.
5. **Primary-key sort tiebreaker** — `appendPrimaryKeySorting({ columns,
sorting })` appends the primary-key column(s) (ascending, declaration order)
   to the sort **at query-build time**. A primary-key column the user already
   sorts by keeps the user's entry and is not duplicated.

### Key Design Choices

- **Query-time only** — the tiebreaker is applied where each route builds its
  API request (loader + `onLoadMore`). The store keeps only the user's sorting,
  so the UI sort indicators are unchanged; the primary key is an implicit
  ordering concern, not a visible user sort.
- **Validation is crud-scoped** — `validateTableCrudConfig` requires at least
  one `isPrimaryKey` column only when `read`/`update`/`delete` is enabled (those
  need a row id). Create-only tables and non-crud tables do not require one.
- **Non-generic `crud` simplifies the type graph** — because `crud` no longer
  carries `TData`, `TableMetaState` stays non-generic and the `metaStore` is a
  plain `TStore<TableMetaState>` (no per-row generic threading or erasure casts).

## Consequences

- Every server-paginated table marks its id column(s) with `isPrimaryKey` and
  composes `appendPrimaryKeySorting(sanitizeSorting(...))` when calling its API.
- CRUD receiving routes (`view/:id`, `edit/:id`, delete action) are unchanged
  for single-column primary keys (the id equals the raw value). Composite keys
  require the route to split the id on `PRIMARY_KEY_ID_DELIMITER`.
- `car-sales` (the single-fetch demo that resolves sorting server-side from the
  request URL) marks its primary key but does not inject the tiebreaker
  client-side, since its sort is parsed on the server from the URL. Adding the
  tiebreaker there would require passing explicit sorting to that endpoint.
- The function-resolver form of the row id is no longer supported; a row id must
  be derivable from column values.
