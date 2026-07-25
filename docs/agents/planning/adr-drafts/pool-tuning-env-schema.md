# Draft — Connection-pool tuning via the shared env schema

> **Draft — it holds no ADR number.** A number is assigned when the decision is
> adopted, not when it is proposed: a draft that reserves one goes stale as the
> sequence moves on, which is how two ADR-047s came to exist. On adoption, move
> this file into the home its tier calls for and take the number
> `vp run adr:verify` reports as free. See
> [ADR-048](../../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md).
>
> This one may not warrant an ADR at all — it could land as a `PATTERNS.md` or
> config note instead, if the team judges it too small.

## Context

`getPool` builds the pool with **credentials only**
(`packages/server/src/db/get-pool.util.ts`); the env schema
(`env.schema.ts`) has only the five `DB_*` credential keys. So pg defaults
apply: `max: 10`, unbounded connection-acquisition wait, no `idleTimeoutMillis`,
no `statement_timeout`. This single `getPool` is shared by every Node consumer
(react-router, admin_system, api-server, scan-ingestion).

## Problem

Under load the process stalls silently rather than degrading gracefully — a slow
query holds a connection indefinitely, acquisition waits forever, and there is no
per-statement ceiling.

## Options considered

1. **Hard-code tuned constants in `getPool`.** Rejected — not environment-aware;
   dev/CI/prod want different ceilings.
2. **Per-app pool config.** Rejected — `getPool` is deliberately the single shared
   contract; per-app forks erode that.
3. **Extend the shared Zod env schema with optional tuning keys.** Chosen.

## Decision

- Add `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`, `DB_IDLE_TIMEOUT_MS`,
  `DB_STATEMENT_TIMEOUT_MS` to `env.schema.ts` as **optional, coerced, with safe
  defaults**; pass them into `new Pool(...)`.
- Document them in `.env.example`.

## Consequences

- Backward compatible (all optional) → not `breaking-change`; no public **type**
  surface change if purely additive to internal config, but INVENTORY + changeset
  as usual for `@lcabrera/server`.
- Every Node consumer inherits graceful degradation for free — highest-leverage
  single change in the perf workstream.

## References

- Plan: `architecture-improvement-plan.md` §P5
- Planner issue: P-13
