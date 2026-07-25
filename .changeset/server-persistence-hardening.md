---
'@lcabrera/server': minor
---

Harden the persistence layer: typed DB errors, a transaction seam, and a tuned pool.

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
