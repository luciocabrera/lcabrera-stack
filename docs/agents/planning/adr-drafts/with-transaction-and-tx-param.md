# Draft — `withTransaction` + `tx?: PoolClient` executor parameter

> **Draft — it holds no ADR number.** A number is assigned when the decision is
> adopted, not when it is proposed: a draft that reserves one goes stale as the
> sequence moves on, which is how two ADR-047s came to exist. On adoption, move
> this file into the home its tier calls for and take the number
> `vp run adr:verify` reports as free. See
> [ADR-048](../../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md).

## Context

Order creation assigns the primary key with a read-then-write across **two pooled
connections**:

- `new-order.action.ts` — `const orderId = await getNextOrderId()` then
  `await insertOrder({ values })`.
- `getNextOrderId` → `.server/enterpriseOrders.service.ts` → `getMaxValue`
  (`packages/server/src/db/get-max-value.util.ts`) runs
  `SELECT COALESCE(MAX(order_id)...) + 1`; `insertOrder` runs a separate `INSERT`.

The table has **no sequence** (`get-max-value.util.ts` documents it as a "next id"
read for tables without one). There is **no `withTransaction`/`PoolClient` seam
anywhere** in `@lcabrera/server`; the only hand-rolled `BEGIN/ROLLBACK` lives in
`packages/scan-ingestion/src/db/runMigrations.ts`. `scan-ingestion` otherwise
avoids app-level transactions by pushing multi-step writes into stored procedures.

## Problem

Two concurrent creates both read the same `MAX`, both compute `MAX+1`, and the
second `INSERT` collides on the PK → unhandled `23505` (which today lands in the
`customer_name` catch-all as a crash-shaped string). This is a **live correctness
bug**, not speculative.

## Options considered

1. **Wrap read+write in a transaction on one connection.** Necessary but _not
   sufficient_: under READ COMMITTED a single connection's `SELECT MAX` still races
   a concurrent transaction unless it also takes a row/advisory lock or retries.
2. **`SELECT ... FOR UPDATE` / advisory lock** on the id-allocation read.
3. **Retry-on-`23505`** layered on the typed error from the `server-error-translation` draft.
4. **Introduce a Postgres sequence / identity column** (the `scan-ingestion` house
   style implies this is idiomatic here).

## Decision

- Add `@lcabrera/server/db/with-transaction.util.ts` — `withTransaction(cb: (tx:
PoolClient) => Promise<T>)` doing `connect → BEGIN → COMMIT/ROLLBACK → release`.
- Thread an optional `tx?: PoolClient` through the write executors
  (`insert-row`, `update-rows`, `get-max-value`, `select-rows`), falling back to
  `getPool()` when absent (backward compatible).
- Extract `.server/createOrder.usecase.ts` running `getMaxOrderId → insertOrder`
  on one `tx`. Use-case files are introduced **only** where a transaction / multi-
  repo coordination exists — not per action.
- **Atomicity is transaction + one of {`FOR UPDATE`/advisory lock, retry-on-`23505`
  via the `server-error-translation` draft's typed conflict}.** The transaction alone narrows but does not close
  the window; the implementing issue (P-07) must pick and document the locking/retry
  strategy. A real sequence is the recommended long-term fix and is called out as a
  follow-up.

## Consequences

- `tx?: PoolClient` is an **additive** change to executor signatures — still an
  api-surface event: dual `exports`/`publishConfig.exports`, snapshot regen, and a
  changeset. Additive → not `breaking-change`.
- The generic transaction helper removes the `runMigrations` duplication and
  unblocks any future atomic write path across apps.
- Highest-risk item in the plan: correctness subtlety (locking vs retry) is a
  deliberate decision, not a mechanical `BEGIN`.

## References

- Plan: `architecture-improvement-plan.md` §(a) + Risks table (order_id race)
- the `server-error-translation` draft (error translation — the typed `23505` conflict retry depends on it)
- Planner issues: P-04 (this ADR), P-05, P-07
