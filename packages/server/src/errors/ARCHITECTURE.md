# `src/errors/` Architecture

This package's typed error vocabulary. One job: **a driver error never leaves this
package untranslated, and an error class never leaves the server.**
[ADR-050](../../../../docs/decisions/ADR-050-server-error-translation-and-result-contract.md)
is the decision; this file is how it is built.

There are two families here, and the split matters:

- **Translated driver rejections** — everything under `PersistenceError`. The
  database rejected something.
- **Refusals this package raised itself** — `GroupingRefusedError`. Nothing came
  from the driver, and most instances are raised before a connection is even
  borrowed ([ADR-066](../../../../docs/decisions/ADR-066-grouping-guard-rails-and-per-query-timeout.md)).

`GroupingRefusedError` deliberately does **not** extend `PersistenceError`.
Widening the base to cover a pure pre-flight refusal would stop
`instanceof PersistenceError` meaning "the database rejected this", which is the
one thing it is for. `toSerializableDbError` is what covers both families in one
call.

## The shape

```
pg rejection ──▶ mapDbError ──┬─ 23505 ─▶ UniqueConstraintViolationError ─┐
                              ├─ 23503 ─▶ ForeignKeyViolationError ───────┤─▶ extends PersistenceError
                              ├─ 57014 ─▶ QueryCanceledError ────────────┤
                              └─ else ──▶ PersistenceError ───────────────┘

guard rail   ──▶ GroupingRefusedError (extends Error, never PersistenceError)

any of them  ──▶ toSerializableDbError ──▶ SerializableDbError (plain data)
```

Subclassing is what makes `error instanceof PersistenceError` the single check
that catches every translated failure, including a SQLSTATE this package starts
naming later.

`57014` is named for the **SQLSTATE, not the cause**: `statement_timeout` raises
it and so does `pg_cancel_backend`, so `StatementTimeoutError` would be a claim
the code cannot support.

`db/run-query.util.ts` applies `mapDbError` for every executor, so a consumer of
`selectRows`/`insertRow`/… inherits this without doing anything. Reach for
`mapDbError` directly only when you run SQL through `getPool` yourself.

## Crossing a loader or action boundary

`toSerializableDbError` maps any of the above to `SerializableDbError`, a plain
discriminated union with a `kind`, and that mapping is not optional at the edge.
React Router single fetch drops functions, so a class instance arrives at the
client with no prototype — every `instanceof` there is false, and `Error.message`
is a **non-enumerable** own property, so it is gone outright. The class serializes
to a shape the client cannot recognise, silently, with no error anywhere.

Its fallback arm carries none of the original message. An untranslated throw is by
definition one this package never vetted, so forwarding its text would reopen the
leak the translation layer exists to close.

## What crosses out of here, and what does not

| Carried on the error   | Withheld                                           |
| ---------------------- | -------------------------------------------------- |
| A safe message of ours | pg's message (names tables, columns, indexes)      |
| `fields.code`          | pg's `detail` — it **quotes the offending values** |
| `fields.constraint`    | anything else off the driver error                 |
| `fields.column`        |                                                    |
| `cause` (server-only)  |                                                    |

`detail` is withheld at the source rather than redacted at the edge, because
redaction only holds until the first consumer forgets. `cause` keeps the whole
original rejection reachable for a server log, which is where a developer reads it.

## Two things that look wrong and are not

**Narrowing is structural, never `instanceof pg.DatabaseError`.** A consumer can
resolve two copies of `pg` — its own plus a transitive one — and `instanceof` is
then false for an error this package must still recognise. `hasPostgresErrorCode`
and `readPgErrorFields` both narrow structurally for that reason.

**`mapDbError` returns an already-translated error unchanged.** The executors
compose (`selectFilterOptions` → `selectDistinctRows` → `selectRows`), so one
rejection meets it more than once; re-wrapping would bury the specific type under a
generic `PersistenceError` and grow the `cause` chain per hop.

## Files

| File                                   | Role                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `map-db-error.util.ts`                 | **Public entry point.** SQLSTATE → typed error; idempotent                             |
| `persistence.error.ts`                 | **Public.** The base class and the fallback                                            |
| `unique-constraint-violation.error.ts` | **Public.** `23505`                                                                    |
| `foreign-key-violation.error.ts`       | **Public.** `23503`                                                                    |
| `query-canceled.error.ts`              | **Public.** `57014` — named for the code, since `pg_cancel_backend` raises it too      |
| `grouping-refused.error.ts`            | **Public.** A grouped read this package refused; carries `reason`, `column`, the bound |
| `to-serializable-db-error.util.ts`     | **Public entry point.** Any of the above → the plain union a loader may return         |
| `has-postgres-error-code.util.ts`      | **Public.** Generic SQLSTATE narrowing for a code this package does not name           |
| `errors.types.ts`                      | **Public.** `PgErrorFields`, `GroupingRefusalReason`, `SerializableDbError`            |
| `read-pg-error-fields.util.ts`         | Private. Lifts those fields off an unknown rejection                                   |
| `errors.constants.ts`                  | Private. The SQLSTATEs `mapDbError` names                                              |

## Why there is no barrel

Every subpath in the three built public packages is exported per file, and this
package contains no barrel at all. Adding one here would create a second
resolution path that no command in this repo exercises — the hazard
`publish:verify` exists for. `@lcabrera/utils` exports its own `./errors/*` the
same way.
