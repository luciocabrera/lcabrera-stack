# ADR-050 — Translate pg errors at the persistence layer; cross the loader boundary as plain data

**Status:** Accepted

## Context

The `@lcabrera/server` executors ran `getPool().query` and let the driver's
`pg.DatabaseError` propagate untranslated — `insert-row.util.ts`,
`update-rows.util.ts`, `delete-rows.util.ts`, `get-max-value.util.ts`,
`select-rows.util.ts`, `get-rows-count.util.ts`.

At the consuming edge, both enterprise-orders mutating actions dump whatever
arrives onto one hard-coded field:

- `apps/react-router/src/routes/enterprise-orders/new-order/new-order.action.ts`
- `apps/react-router/src/routes/enterprise-orders/edit-order/edit-order.action.ts`

Both do `errors: { customer_name: getErrorMessage({ error, … }) }`, so a unique
collision on `order_number` renders under the _customer name_ input, and the raw
`pg` message string reaches the browser. `config/toOrderFieldErrors.util.ts` maps
only `ZodError`; there is no DB-error → field path.

Another app had already reinvented a slice of this in a route-local
`hasPostgresErrorCode.util.ts`, which is what the missing abstraction looks like
when each consumer solves it alone.

## Problem

1. **Security.** A pg message embeds table, column and index names, and its
   `detail` line quotes the offending values (`Key (email)=(a@b.c) already
exists`). Every consumer that stringifies an error was shipping that to the
   client.
2. **Correctness / UX.** Every persistence failure is routed to one hard-coded
   field regardless of which column actually failed.
3. **Duplication.** Each consumer hand-rolls SQLSTATE detection.

## Options considered

1. **A `neverthrow`-style `Result` object repo-wide.** Rejected — a class with
   methods is silently stripped by React Router 7 single fetch when returned from
   a loader or action, and it imposes a large vocabulary shift for no enforcement
   gain here.
2. **Fix the `catch` block in each action.** Rejected — it treats the symptom in
   two (soon N) places, the driver detail still escapes the persistence layer, and
   every future consumer repeats the work.
3. **Translate at the persistence layer, and map to a plain serializable
   discriminated union at the edge.** Chosen.

## Decision

**A driver error never leaves `@lcabrera/server` untranslated, and an error class
never leaves the server.**

- A node-only **`errors/` subpath** carries `mapDbError`, which narrows SQLSTATE:
  `23505` → `UniqueConstraintViolationError`, `23503` → `ForeignKeyViolationError`,
  anything else → `PersistenceError`. The two named errors **extend**
  `PersistenceError`, so one `instanceof` check catches every translated failure,
  including a code the package starts naming later.
- **The message on a translated error is ours, never the driver's.** The original
  rejection stays on `Error.cause` for server-side logging, so nothing is lost
  where it is safe to have it.
- **`constraint`, `column` and `code` are carried; `detail` is not.** Those three
  are what a consumer routes a violation on. `detail` is the field that quotes
  values, so it is the one thing this layer exists to withhold.
- **Narrowing is structural, not `instanceof pg.DatabaseError`.** A consumer can
  resolve two copies of `pg` — its own plus a transitive one — and `instanceof`
  is then false for an error that must still be recognised. The existing
  `hasPostgresErrorCode` shape is generalised into the package rather than a
  parallel one being invented, and that app now imports it.
- **Every executor is wrapped, not only the four write executors.** They all go
  through one internal `runQuery` helper that owns the `try`/`catch`. A read
  cannot raise `23505`, but it can raise `42703 undefined_column`, whose message
  names a column — the same leak. One helper also means the behaviour cannot be
  present in five executors and missing from the sixth.
- **`mapDbError` passes an already-translated error through untouched.** The
  executors compose (`selectFilterOptions` → `selectDistinctRows` → `selectRows`),
  so a rejection meets it more than once; re-wrapping would bury the specific type
  under a generic `PersistenceError`.
- **At the action edge, the typed error maps to a plain serializable
  discriminated union** routed to the correct field, replacing the `customer_name`
  catch-all. Error **classes** stay server-only.

## Consequences

- **New public surface on `@lcabrera/server`**: six `./errors/*` subpaths, in both
  `exports` and `publishConfig.exports`, with `reports/api-surface/server.txt`
  regenerated and a changeset. Additive → not a breaking change.
- **No barrel.** The draft proposed one; the three built public packages export
  every subpath per file and contain no barrel at all, and adding one here would
  create a second resolution path that no command in this repo exercises — the
  exact hazard `publish:verify` exists for. The `errors/` folder follows the
  `@lcabrera/utils` `./errors/*` precedent instead.
- **A consumer must map constraint names to fields itself.** Only the consumer
  knows its own schema, so `UniqueConstraintViolationError` hands over
  `fields.constraint` and stops there. That mapping is the edge's job (#399).
- **The DU-across-single-fetch rule stays convention-enforced.** Nothing gates a
  class being returned from a loader; the rule is the review check plus this ADR.
- **Callers that inspected `error.message` for driver text will stop matching.**
  That is the fix, not a regression — but it is a behavioural change for any
  consumer that was string-matching pg output, and the changeset says so.

## Alternatives considered

**Carry `detail` too, and redact at the edge.** Rejected: it makes every consumer
responsible for not forwarding a field, and the first one that forgets reproduces
the leak. Withholding it at the source is the only version that holds by default.

**Have `mapDbError` throw rather than return.** Rejected — returning keeps the
caller's control flow visible (`throw mapDbError(error)`) and makes the function
testable without a `try`.

**Leave reads untranslated so debugging keeps the raw message.** Rejected on the
`42703` case above. `Error.cause` keeps the raw message reachable in a server log,
which is where a developer actually reads it.
