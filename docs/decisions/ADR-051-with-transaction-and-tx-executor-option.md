# ADR-051 — `withTransaction` + an optional `tx` executor option, and how id allocation is made safe

**Status:** Accepted

## Context

Order creation assigns its primary key with a read-then-write across **two
pooled connections**:

- `new-order.action.ts` — `const orderId = await getNextOrderId()` then
  `await insertOrder({ values })`.
- `getNextOrderId` → `.server/enterpriseOrders.service.ts` → `getMaxValue`
  (`packages/server/src/db/get-max-value.util.ts`) runs
  `SELECT COALESCE(MAX(order_id), 0) + 1`; `insertOrder` runs a separate `INSERT`.

The table has **no sequence** — `get-max-value.util.ts` documents itself as the
"next id" read for tables without one. Before this ADR there was **no
`withTransaction` or `PoolClient` seam anywhere** in `@lcabrera/server`; the only
hand-rolled `BEGIN`/`ROLLBACK` lived in a migration runner outside this package,
which otherwise avoids app-level transactions by pushing multi-step writes into
stored procedures.

## Problem

Two concurrent creates both read the same `MAX`, both compute `MAX + 1`, and the
second `INSERT` collides on the primary key → an unhandled `23505`, which today
lands in the `customer_name` catch-all as a crash-shaped string. This is a **live
correctness bug**, not a speculative one.

There is a second problem underneath it: with no transaction seam at all, _no_
multi-step write anywhere in the repo can be made atomic without hand-rolling
`BEGIN`/`COMMIT`/`ROLLBACK` again, per caller.

## Options considered

1. **Wrap the read and the write in a transaction on one connection.** Necessary
   but **not sufficient**: under READ COMMITTED a single connection's `SELECT MAX`
   still races a concurrent transaction unless it also locks or retries.
2. **`SELECT … FOR UPDATE` on the allocation read.** Not available here.
   Postgres rejects a locking clause combined with an aggregate — "FOR UPDATE is
   not allowed with aggregate functions" ([SELECT reference, The Locking
   Clause](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)) —
   and `getMaxValue` is `MAX(...)`. There is also no row to lock when the table is
   empty, which is exactly when two creates race hardest.
3. **A transaction-scoped advisory lock** (`pg_advisory_xact_lock`) around the
   allocate-then-insert. Serialises allocation across sessions, releases at
   COMMIT/ROLLBACK with no unlock path to forget, and needs no schema change.
4. **Retry on the typed `23505`** from ADR-050.
5. **A real sequence or identity column.** The correct long-term fix, and the
   house style on the ingestion side; it needs a migration on an app-owned table.

## Decision

**The seam is generic; the allocation strategy is specific, and this ADR fixes
both so #400 implements rather than re-decides.**

- **`withTransaction({ run })`** borrows one connection from the pool, runs
  `BEGIN` → `run(tx)` → `COMMIT`, rolls back on a throw, and **always** releases
  the connection.
- **`runInTransaction({ client, run })`** is the same BEGIN/COMMIT/ROLLBACK over a
  connection the **caller** owns, opening and closing nothing. It exists because
  the migration runner cannot borrow from the pool — it connects to a database it
  may have just created — and it now uses this instead of its own copy. Splitting
  the two also keeps "who releases the connection" answerable in one place.
- **A failed ROLLBACK is swallowed, and the original error is rethrown.** pg's
  canonical example lets a throw from the ROLLBACK replace the error being
  unwound, so what surfaces is "connection terminated" instead of the constraint
  violation that caused it. A ROLLBACK only fails when the connection is already
  gone, and pg's `Pool` discards a client that has emitted `error`.
- **The executor seam is an optional `tx`**, not a positional argument:
  `insertRow({ …, tx })`. It lives in `db/db.types.ts` as `ExecutorOptions`,
  **not** on the descriptors in `query-builder/`, because that folder is the pure
  half of `db/` and knows nothing about connections. A descriptor says _what_ SQL
  to run; `tx` says _where_. Omitted, every executor uses the pool singleton, so
  every existing caller is unaffected.
- **`tx` is typed `ClientBase`, pg's common base of `Client` and `PoolClient`** —
  not `PoolClient`. A callback able to `release()` the connection handed to it can
  pull it out from under the transaction wrapping it, and `ClientBase` is also
  what lets a caller-owned `Client` use the same executors.
- **The sanctioned atomic-allocation strategy is `withTransaction` +
  `pg_advisory_xact_lock` on the allocation key**, with retry-on-typed-`23505`
  (ADR-050's `UniqueConstraintViolationError`) permitted as belt-and-braces.
  #400 follows this; it does not re-open the choice. **Introducing a sequence or
  identity column for `order_id` is the recommended follow-up** and supersedes the
  lock when it lands.

## Consequences

- **`tx` is an additive signature change to every executor** — still an
  api-surface event: dual `exports`/`publishConfig.exports`, snapshot regen, and a
  changeset. Additive → not a breaking change.
- **`tx` is threaded through the read executors too**, not only the writes. A
  read inside a transaction must see that transaction's own uncommitted writes, so
  a write-then-read sequence is wrong without it.
- **The trap this creates, and it is a real one:** an executor called _without_
  `tx` inside a `withTransaction` block runs on a **different** connection, outside
  the transaction, and commits independently. Nothing detects that — it is why the
  parameter is named rather than implicit, and why the helper's own doc comment
  says so.
- **`runMigrations`' hand-rolled transaction is gone**, so there is one
  BEGIN/COMMIT/ROLLBACK implementation in the repo rather than two.
- **A transaction alone does not close the `order_id` race.** Anyone reading
  `withTransaction` and assuming otherwise gets a narrower window and the same bug;
  the helper's doc comment points back here for that reason.

## Alternatives considered

**Put `tx` on the descriptor types in `query-builder.types.ts`** (as the draft
proposed). Rejected: it puts a live connection type into the module that
`query-builder/`'s own `ARCHITECTURE.md` requires to stay DB-free. The intersection
`ExecutorOptions & InsertQueryDescriptor` gives callers the identical single-object
call shape without that.

**One `withTransaction` that optionally takes a caller's client.** Rejected — it
makes "is this connection mine to release?" a runtime branch inside the helper.
Two functions answer it statically.

**Skip the generic helper and fix `new-order` alone.** Rejected: it leaves the
next multi-step write to hand-roll the same thing, which is how the `runMigrations`
copy came to exist.

**Retry-on-`23505` as the primary strategy.** Rejected as the default: it is
correct but does redundant work under contention and needs a retry budget nobody
tunes. It stays available as a secondary guard.
