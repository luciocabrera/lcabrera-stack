# ADR-066 — Bound a grouped read with a cardinality estimate, a row-limit backstop and a transaction-scoped statement timeout

- **Status:** Accepted
- **Date:** 2026-08-13
- **Scope:** `@lcabrera/server` (`db/group-query-builder/`, `db/select-grouped-rows.util.ts`, `errors/`), the grouped-read loader edge in `apps/react-router`
- **Issue:** #573
- **Related:** ADR-058 (grouping legality by analytical role), ADR-059 (aggregation is builder-generated), ADR-050 (error translation and the plain-data boundary), ADR-051 (`withTransaction` and the `tx` executor option)

## Context

ADR-058 settled which **columns** may be a group key and which aggregates are
legal for each; ADR-059 settled how the SQL is emitted. Neither bounds the
**result**. A grouping over several columns that are each individually legal can
still return a payload nobody can use: the product of their cardinalities is what
decides the row count, and no per-column rule sees the product.

Two facts from the design probes frame everything below. A depth-4 cube over
500 000 rows returned 1 422 rows in 654 ms, while the `∏(dₖ+1)` bound predicted
3 564 — a true upper bound, roughly 2.5× conservative when the combinations are
sparse. And `pg_stats` has **no row at all** for a table that has never been
analysed, which is every freshly restored database.

The pool sets `statement_timeout` once per connection from
`DB_STATEMENT_TIMEOUT_MS` (30 s by default) and `runQuery` had no override, so a
single grouped read could occupy a connection for the full pool-wide budget —
long past the point where the browser waiting on the loader has given up.

## Problem

1. **Nothing estimates the result before running it.** The first signal that a
   grouping was too expensive is the payload arriving, or not arriving.
2. **A timeout cannot be set per query without three traps.** `SET
statement_timeout` without `LOCAL` persists on the pooled connection and
   silently re-tunes every later query that borrows it. `SET LOCAL
statement_timeout = $1` is a **syntax error** — `SET` is a utility statement
   and cannot be prepared, so the value would have to be spliced into the SQL
   text. And an executor called without `tx` inside a transaction runs on the
   pool singleton instead, outside it, so the timeout applies to nothing — with
   no symptom, because the query still succeeds.
3. **A timeout has no type.** SQLSTATE `57014` fell through `mapDbError` to the
   generic `PersistenceError`, indistinguishable from a constraint failure.
4. **A refusal cannot survive the loader boundary.** React Router single fetch
   drops functions, so an error class reaches the client stripped of its
   prototype: `instanceof` is false and `message` — a non-enumerable own property
   of `Error` — is gone entirely. Silently, with no error anywhere.

## Options considered

1. **Costed `EXPLAIN` as the primary guard.** Rejected: its estimate for a
   grouping-sets node derives from the same `pg_stats` rows the catalogue query
   already reads, so it is an extra round trip for no new information when
   statistics exist and equally blind when they do not. (`EXPLAIN ANALYZE` is not
   a candidate at all — it executes the query.)
2. **Pure pre-flight refusal, with no row limit.** Rejected on the measurement
   above: a bound that is 2.5× conservative on sparse data refuses queries that
   would have been fine, and with no statistics it can only refuse everything or
   allow everything.
3. **Estimate, then warn or refuse, with a row limit as the backstop.**
   `Chosen.` The estimate handles the case it can answer; the limit handles the
   case it cannot, and the same mechanism serves both.

## Decision

**A grouped read is bounded four ways, in this order.**

1. **Depth, before any round trip.** `assertGroupDepth` — non-empty, at most
   `MAX_GROUP_KEYS`, no repeats — is pure, and `selectGroupedRows` runs it before
   it borrows a connection. A request at depth 9 costs no catalogue query and no
   pooled connection. `assertGroupKeys` still calls it, so the builder refuses the
   same shapes for any caller; the pre-flight check is an earlier gate, never the
   only one.
2. **The catalogue's per-column verdict** (ADR-058), unchanged, and checked
   **before** the cardinality bound. Both can fire for the same request, and
   "that column cannot be a group key" is the actionable sentence where "the
   product is too large" is not.
3. **A cardinality estimate**, summed over **the grouping sets the query will
   actually emit** rather than from a per-mode formula. `expandGroupingSets` is
   the same function the SQL is built from, so `flat`, `rollup` and cube alike get
   a correct bound with nothing to update when a mode is added. Then:
   - above `MAX_GROUP_ROWS_REFUSE` (50 000, ~10 MB through the SSR payload) →
     refused, **naming the widest group key**, which is the one whose removal
     helps most;
   - above `MAX_GROUP_ROWS_WARN` (5 000, ~1 MB) → a warning carried beside the
     rows;
   - **statistics unavailable → warn and proceed, never refuse.** Refusing there
     would leave grouping dead on every freshly restored database.
4. **The row-limit backstop**, which is what makes step 3's optimism safe. With
   no estimate the read runs under a `LIMIT` of `MAX_GROUP_ROWS_WARN + 1`, and
   reaching that limit is a **refusal**, not a truncation: a grouped result
   missing its tail is missing subtotals too, so it reads exactly like a correct
   one. A caller whose own `maxRows` is tighter keeps its number and gets no
   backstop — reaching a ceiling it chose is truncation it asked for.

**The timeout is `SELECT set_config('statement_timeout', $1, true)`, issued
inside a transaction.** All three traps are answered by that one spelling:
`set_config` is an ordinary function call so the value is a bound parameter;
`is_local = true` scopes the setting to the transaction, so it is gone at
`COMMIT`; and `selectGroupedRows` opens the transaction itself when the caller
gave it no `tx`, then threads that client through **both** round trips — the
catalogue query and the grouped query — so neither can silently fall back to the
pool. The value comes from a new `DB_GROUP_STATEMENT_TIMEOUT_MS` (10 s), well
below the pool-wide 30 s: a grouped read sits behind a loader, and failing at 10 s
leaves headroom to render an error rather than having the request time out.

`selectGroupedRows` therefore always runs in a transaction. Not for atomicity — a
read needs none — but because transaction-locality is the only way to set the
timeout for this query and no other.

**`57014` becomes `QueryCanceledError extends PersistenceError`**, branched in
`mapDbError` before the fallback. It is named for the SQLSTATE, not for the
timeout: `pg_cancel_backend` raises the same code, so `StatementTimeoutError`
would be a claim the code cannot support.

**A refusal is `GroupingRefusedError`, and it is deliberately not a
`PersistenceError`.** Nothing in it came from the driver, it carries no pg
diagnostics, and most instances are raised before a connection is borrowed.
Widening `PersistenceError` to cover them would stop it meaning "the database
rejected this", which is the one thing it is for (ADR-050).

**At the loader edge, both map to `SerializableDbError`** —
`toSerializableDbError`, a plain discriminated union with a `kind` and this
package's own message. The enterprise-orders grouped read returns it on the
response instead of throwing, mirroring what the mutating actions already do with
a field-error object (ADR-050): the edge returns plain data, never a class.

## Consequences

- **`selectGroupedRows` now costs a pooled connection and a `BEGIN`/`COMMIT`
  per call**, plus one extra round trip for `set_config`. That is three
  statements of overhead on a read that was two, and it is the price of the
  timeout being real.
- **`BuiltGroupQuery` gained `guardRails`**, and the emitted `LIMIT` is the
  rails' answer rather than the requested `maxRows`. A caller reading `maxRows`
  back off its own descriptor and assuming it is what ran would now be wrong —
  read `guardRails.rowLimit.limit`.
- **The estimate over-refuses on sparse data**, by roughly the measured 2.5×.
  That is the safe direction for a hard ceiling, and the warn threshold plus the
  backstop exist so that the common case still returns data. If it bites in
  practice, the bound needs a sparsity factor — not a higher ceiling.
- **`GroupingRefusedError` is not caught by `instanceof PersistenceError`.** Any
  consumer that treated that check as "everything `@lcabrera/server` throws" has
  to add the second arm, or use `toSerializableDbError`, which covers both.
- **The enterprise-orders grouped read no longer rejects on a refusal**, so the
  route's error boundary no longer sees one. The refusal reaches the client as
  `response.error` instead; rendering it is a follow-up, and until then a refused
  grouping shows an empty table rather than a message.
- **A DB-free suite cannot prove the timeout.** The claims that it fires and that
  the pool default survives are only observable against a real server, so they
  live in `apps/react-router/src/.server/groupingGuardRails.smoke.test.ts` beside
  the sibling grouping probes, gated behind `SMOKE_DB`.

## Alternatives considered

**Set the timeout on the pool and let it cover grouped reads too.** Rejected: one
number cannot serve a 10 s analytical read and a 30 s batch write, and lowering
the pool default to suit grouping would re-tune every consumer of the package.

**Return a truncated result at the backstop instead of refusing.** Rejected: a
grouped result missing its tail is missing the subtotals that belong to it, so it
is not a shorter answer — it is a wrong one that looks right.

**Refuse when statistics are unavailable.** Rejected on the restored-database
case: `pg_stats` is empty for every table until something analyses it, so this
turns "grouping is broken" into the first impression of every new environment.

**Keep throwing the error class from the loader and let the error boundary
stringify it.** Rejected: `Error.message` is non-enumerable, so the class arrives
at the client as an empty object and the boundary can only render a generic
sentence. That is the behaviour ADR-050 already rejected at the action edge.

## References

- Issue [#573](https://github.com/luciocabrera/vite-react-compiler/issues/573);
  parent [#547](https://github.com/luciocabrera/vite-react-compiler/issues/547);
  blocks [#574](https://github.com/luciocabrera/vite-react-compiler/issues/574) (cube)
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md),
  [ADR-059](./ADR-059-aggregation-is-builder-generated.md),
  [ADR-050](./ADR-050-server-error-translation-and-result-contract.md),
  [ADR-051](./ADR-051-with-transaction-and-tx-executor-option.md)
- [`packages/server/src/db/group-query-builder/ARCHITECTURE.md`](../../packages/server/src/db/group-query-builder/ARCHITECTURE.md)
- [`packages/server/src/errors/ARCHITECTURE.md`](../../packages/server/src/errors/ARCHITECTURE.md)
