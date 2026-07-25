# Draft — Server error translation + serializable Result contract

> **Draft — it holds no ADR number.** A number is assigned when the decision is
> adopted, not when it is proposed: a draft that reserves one goes stale as the
> sequence moves on, which is how two ADR-047s came to exist. On adoption, move
> this file into the home its tier calls for and take the number
> `vp run adr:verify` reports as free. See
> [ADR-048](../../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md).

## Context

The persistence layer (`@lcabrera/server` executors) runs raw `getPool().query`
and lets the driver's `pg.DatabaseError` propagate untranslated:
`packages/server/src/db/insert-row.util.ts`, `update-rows.util.ts`,
`get-max-value.util.ts`, `select-rows.util.ts`. At the consuming edge, both
enterprise-orders mutating actions dump the raw error onto a hard-coded field:

- `apps/react-router/src/routes/enterprise-orders/new-order/new-order.action.ts`
- `apps/react-router/src/routes/enterprise-orders/edit-order/edit-order.action.ts`

Both do `errors: { customer_name: getErrorMessage({ error, ... }) }`, so a unique
collision on `order_number` renders under the _customer name_ input and the raw
`pg` message string reaches the client. `config/toOrderFieldErrors.util.ts` maps
only `ZodError` — there is no DB-error → field path today. `admin_system` has
already reinvented a slice of this (`.../trigger-scan/hasPostgresErrorCode.util.ts`),
which is evidence the abstraction is missing and being duplicated per-app.

## Problem

1. **Security:** raw SQL/schema detail leaks to the browser via `error.message`.
2. **Correctness/UX:** every persistence failure is mis-routed to one hard-coded
   field regardless of the real column.
3. **Duplication:** each consumer hand-rolls SQLSTATE detection.

## Options considered

1. **`neverthrow`-style Result object repo-wide.** Rejected — a class with methods
   is silently stripped by RR7 single-fetch when returned from a loader/action, and
   it imposes a large vocabulary shift for no enforcement gain here.
2. **Fix the `catch` block in each action individually.** Rejected — treats the
   symptom in two (soon N) places; the driver detail still escapes the persistence
   layer and every future consumer repeats the work.
3. **Translate at the persistence layer + map to a plain serializable DU at the
   edge.** Chosen.

## Decision

- Add a node-only `@lcabrera/server/errors` subpath: `mapDbError` narrowing
  `pg.DatabaseError.code` (`23505` → `UniqueConstraintViolationError`, `23503` →
  `ForeignKeyViolationError`, else `PersistenceError`), plus one `*.error.ts` per
  typed error and a barrel. Generalize the existing
  `hasPostgresErrorCode` narrowing rather than inventing a parallel one.
- Write executors wrap `pool.query` so **every** consumer inherits translated
  errors with no signature change.
- The **action edge** maps the typed error to a plain serializable discriminated
  union routed to the correct field (`{ ok: false; fieldErrors: {...} }`),
  replacing the `customer_name` catch-all. Error **classes** stay server-only; only
  a plain DU crosses the loader/action boundary.

## Consequences

- New public surface on `@lcabrera/server`: register `./errors` in **both**
  `exports` and `publishConfig.exports`, update `packages/server/src/INVENTORY.md`,
  regenerate `reports/api-surface/server.*`, and ship a changeset (`api-surface:verify`
  will require it). Additive → not `breaking-change`.
- Fixes a live security leak and a live mis-routed-error UX defect.
- The DU-across-single-fetch rule remains convention-enforced only (review +
  serialization check); no gate stops a class being returned.

## References

- Plan: `docs/agents/planning/architecture-improvement-plan.md` §(c)
- Package topology: ADR-038; duplicate-over-undeclared-edges: ADR-039;
  API-surface snapshot gate: ADR-046
- Planner issues: P-01 (this ADR), P-02, P-03, P-06
