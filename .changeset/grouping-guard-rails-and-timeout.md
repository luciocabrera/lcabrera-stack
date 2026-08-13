---
'@lcabrera/server': minor
---

`selectGroupedRows` now bounds the read it runs, and a grouped read that is
refused or cut short has a type.

**Guard rails.** Before the query runs, the group keys' distinct estimates are
combined over the grouping sets that will actually be emitted. Above 50 000
estimated rows the read is refused — naming the widest group key, which is the
one whose removal helps most; above 5 000 it runs and reports a warning beside
the rows. When the table has never been analysed there is no estimate to work
from, and the read **proceeds** rather than being refused: statistics are absent
on every freshly restored database, and refusing there would make grouping look
broken exactly where it is most needed. It runs under a row limit instead, and
reaching that limit is itself a refusal — a grouped result missing its tail is
missing the subtotals that belong to it, so it reads exactly like a correct one.

**A per-query statement timeout.** A grouped read now runs in a transaction
carrying its own `statement_timeout`, from a new optional
`DB_GROUP_STATEMENT_TIMEOUT_MS` (10 s, deliberately well below the pool-wide
`DB_STATEMENT_TIMEOUT_MS`). It is set transaction-locally through `set_config`,
so it is gone at `COMMIT` and cannot re-tune later queries that borrow the same
pooled connection.

**New exports.**

- `@lcabrera/server/errors/query-canceled.error` — `QueryCanceledError`, SQLSTATE
  `57014`, extending `PersistenceError`. Named for the code rather than for the
  timeout, since `pg_cancel_backend` raises it too.
- `@lcabrera/server/errors/grouping-refused.error` — `GroupingRefusedError`,
  carrying `reason`, the offending `column` and the estimated rows.
- `@lcabrera/server/errors/to-serializable-db-error.util` —
  `toSerializableDbError`, which maps either into `SerializableDbError`, a plain
  discriminated union with no prototype. Use it at any loader or action edge:
  React Router single fetch drops functions, so an error class arrives at the
  client unrecognisable and, `Error.message` being non-enumerable, without its
  message.
- `SerializableDbError` and `GroupingRefusalReason` on
  `@lcabrera/server/errors/errors.types`; `GroupCardinalityEstimate`,
  `GroupCardinalityWarning`, `GroupGuardRails` and `GroupRowLimit` on
  `@lcabrera/server/db/group-query-builder/group-query-builder.types`;
  `MAX_GROUP_ROWS_WARN`/`MAX_GROUP_ROWS_REFUSE` on the grouping constants.

**Behavioural changes to know about.**

- `selectGroupedRows` returns `estimate` and, when there is one, `warning`
  alongside the existing decode metadata.
- `buildGroupQuery` returns `guardRails`, and the `LIMIT` it emits is the rails'
  answer rather than the requested `maxRows`. Read
  `guardRails.rowLimit.limit` if you need the number that ran.
- The grouped-read assertions now throw `GroupingRefusedError` instead of a bare
  `Error`. Messages are unchanged, and it still extends `Error` — but it is
  **not** a `PersistenceError`, because nothing in it came from the driver.
  A consumer using `instanceof PersistenceError` as "everything this package
  throws" needs the second arm, or `toSerializableDbError`, which covers both.
