# `src/.server/` Architecture

Live-Postgres probes for `@lcabrera/server`'s grouped-read path. Nothing ships
from here — the folder holds **only** smoke suites, and they live in this app
rather than in the package for one reason: `packages/server`'s own suite is
DB-free by [ADR-032](../../../../docs/decisions/ADR-032-real-coverage-for-the-fallow-gate.md), and
CI's unit job has no database, so a claim that needs a real server has nowhere
else to be asserted.

`.server/` is a React Router convention: every module inside is stripped from the
client graph and the build fails if client code imports it. That is incidental
here — these files are tests — but it is why the directory is named this way and
why nothing else belongs in it.

## What earns a file here

Only a claim that a mocked test would report **green either way**. That is the
whole entry rule, and each suite states which claim it is.

| File                               | The claim only a real server can settle                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `groupingLegality.smoke.test.ts`   | That a coarse column `dataType` cannot decide group-key or aggregate legality — a `point` has no equality operator, `min(jsonb)` does not exist, and `n_distinct = 0` survives an explicit `ANALYZE` |
| `groupingCapability.smoke.test.ts` | That the catalogue query returns what the resolution rules are fed, for one column per analytical role — `varchar` borrowing `text`'s operator class, an enum's registered against `anyenum`         |
| `groupingGuardRails.smoke.test.ts` | That the transaction-scoped `statement_timeout` actually cancels a query, and that the pool default is intact on the next query using the **same pooled connection** (ADR-066)                       |

Each suite **owns and drops its own fixture**. Anchoring a load-bearing claim to
a table someone else maintains makes the evidence hostage to a schema nobody
promised to keep — which is why the legality probe stopped reading
`wide_alltypes_150` and creates a three-column table instead.

## Two things a probe here has to do

**Discriminate.** A green run proves nothing unless something else would have
produced a different one. `groupingGuardRails` runs the same deliberately slow
query twice — once under a timeout it cannot meet and once under one it can — so
a broken fixture would fail the second case rather than silently vindicating the
first.

**State its preconditions, and assert them.** The warn-and-proceed rail only
fires when a table has no `pg_stats` row, and PostgreSQL's autovacuum daemon will
quietly analyse a fresh table part-way through a suite. `groupingGuardRails`
creates its fixture `WITH (autovacuum_enabled = false)` and asserts the absence
of statistics as its own test, so the precondition fails loudly instead of
turning the two rails after it into tests of nothing.

## Running them

Every suite is gated behind `SMOKE_DB`, so `vp run test` and the DB-less CI unit
job skip them all:

```bash
vp run db:up          # once, from the repo root
vp run test:smoke     # from apps/react-router — sources DB_* + sets SMOKE_DB
```

`groupingGuardRails.smoke.test.ts` forces `DB_POOL_MAX = 1` before the pool is
opened, because "the same pooled connection" is not something to hope for — it
then asserts `pg_backend_pid()` is unchanged, since a _different_ connection
would report an untouched timeout just as happily.
