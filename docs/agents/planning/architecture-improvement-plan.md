# Architecture Improvement Plan (lcabreara)

> **Status:** Advisory synthesis — not an ADR. Produced by a four-agent
> feasibility/architecture evaluation (Strict Architect, Pragmatic Analyst,
> Performance Engineer, DX Advocate) orchestrated against the blueprint in
> [`.github/skills/typescript-api-engineering/generic-architecture-standards.md`](../../../.github/skills/typescript-api-engineering/generic-architecture-standards.md)
> and the reference feature `apps/showcase/src/routes/enterprise-orders/`.
> When a recommendation here graduates into an enforced decision, promote it to a
> real ADR in the home its tier calls for — `docs/decisions/` for the repo, the
> published packages and the toolchain — and cite it by number ([ADR-048](../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md)).
> This document is deliberately kept out of the ADR sequence to avoid claiming
> authority it does not yet have.
>
> **Promoted so far:** (c) error translation → [ADR-050](../../decisions/ADR-050-server-error-translation-and-result-contract.md);
> the `tx` executor seam from (a)/(b) → [ADR-051](../../decisions/ADR-051-with-transaction-and-tx-executor-option.md);
> P5 pool tuning → landed in `env.schema.ts` + `get-pool.util.ts` with no ADR (it
> is configuration, not a decision anything else has to follow).

## Vision

Keep the architecture the repo already has — React Router framework mode as the
transport+controller edge, `.server/` services as the persistence boundary, the
generic `@lcabrera/server` executors as the repository, and pure `config/` utils as
the domain — and close the **three real gaps** the blueprint exposes, without
importing DDD folder ceremony that the suffix system and the build-enforced
`.server/` boundary already deliver more strongly.

The blueprint is written for a standalone Express API. This app has no Express
controller in its primary data path, so the plan **adapts** the blueprint rather
than adopting it: we take its _principles_ (dependency rule, validation-first,
error translation, transactions, one-responsibility-per-layer) and reject its
_mechanisms_ where the repo already has a stronger equivalent (nominal repository
interfaces, entity classes, per-action use-case files for trivial CRUD).

The single sentence that captures the plan: **adopt the blueprint's ideas, reject
its vocabulary, and make the abstraction work carry the correctness and
performance fixes rather than ship as pure ceremony.**

## Principles

Load-bearing principles extracted from the blueprint, kept as the design's
guardrails:

1. **Dependency rule** — dependencies point inward only. Already _stronger_ here:
   the `.server/` boundary is build-enforced (RR strips it from the client graph
   and fails the build on a client import), not conventional.
2. **One responsibility per layer** — no God Service mixing validation + authz +
   business rules + DB.
3. **Validation before the controller** — Zod at the edge; the server re-validates
   authoritatively even when a `clientAction` pre-gated in the browser.
4. **Thin controller** — the RR `loader`/`action` is the controller; it should own
   HTTP concerns (formData, params, redirect, Response) and delegate orchestration.
5. **Error translation at the persistence layer** — map `pg` codes
   (`23505`→conflict, `23503`→FK) to typed domain errors; never leak SQL/schema
   detail to the client.
6. **Transactions for multi-step writes** — a read-then-write that must be atomic
   uses a single connection with `BEGIN/COMMIT/ROLLBACK`.
7. **Domain owns invariants** — here as _pure functions_ (`deriveOrderTotals`,
   `to*Values`), not entity classes; the FP/immutability rules make the function
   form the idiomatic equivalent.
8. **Results that cross the loader/action boundary must be plain serializable
   discriminated unions** — RR7 single-fetch silently drops functions, so no class
   instances with methods may be returned to the client.

## Layering Model (with diagrams)

### Blueprint → this repo mapping

```
STANDARD (Express)          →   THIS REPO (RR7 framework mode)
──────────────────────────────────────────────────────────────
Router + Middleware         →   routes.ts + route root.ts + middleware[]   (transport wiring)
Validation                  →   config/*.schema.ts (Zod) — clientAction pre-gate + action re-validate
Controller                  →   loader / action  (HTTP edge: formData, params, redirect, Response)
Use Case (Application)      →   [PROPOSED, on demand] *.usecase.ts in .server/  (HTTP-free → Result)
Domain (invariants)         →   config/*.util.ts pure derivations (deriveOrderTotals, to*Values)
Repository (impl)           →   .server/<entity>.service.ts  (generic executors + {schema,table,allowedColumns})
Executors                   →   @lcabrera/server/db  (selectRows / insertRow / updateRows / …)
Database                    →   getPool() → pg
```

### Write-path flow (target state)

```
<Form> POST
  → clientAction (browser Zod pre-gate)              [packages/ui + config schema]
  → action (server)                                  [HTTP edge: parse formData, read authContext]
        │  validate → parsed.data
        ▼
     createOrderUseCase({ input, actor })            [.server, HTTP-free, returns Result DU]
        │  deriveOrderTotals / toInsertValues         [config/ pure domain]
        │  withTransaction:  getNextOrderId → insertOrder   ← closes the order_id race
        ▼
     enterpriseOrders.service (repository)            [.server: generic executors + TARGET]
        │  mapDbError (23505 → conflict, field-routed)      [@lcabrera/server error translation]
        ▼
     getPool().query (parameterized)                 [pg]
  ← Result<Order, OrderError>  →  action maps to redirect | { errors } (routed to correct field)
```

### Dependency direction (must stay inward)

```
route module (loader/action) ─▶ use-case ─▶ service(repo) ─▶ executors ─▶ pg
        │                          │             │
        └── imports config/ (pure domain) ───────┘   (domain has NO downward deps)
```

### Client / server boundary

```
CLIENT GRAPH                    ‖  SERVER-ONLY GRAPH (.server/, build-enforced)
────────────────────────────── ‖ ──────────────────────────────────────────
components, config/ (types,     ‖  *.service.ts, *.usecase.ts, getPool,
schema, pure utils),            ‖  @lcabrera/server/db executors, pg
clientAction, loader/action ────╫── imports ▶   (never the reverse)
Result DU crosses single-fetch → MUST be a plain serializable union, never a class.
```

## Proposed Abstractions

Ranked by the combined score (see Scoring Summary). Only **(c)** is an
unconditional adopt.

### (c) Shared error-translation + serializable Result contract — ADOPT (promoted → [ADR-050](../../decisions/ADR-050-server-error-translation-and-result-contract.md))

- A node-only `mapDbError` in `@lcabrera/server` maps `pg` `DatabaseError` codes to
  typed domain errors (`UniqueConstraintViolationError`, `ForeignKeyViolationError`,
  `PersistenceError`). The executors (`insert-row.util.ts`, `update-rows.util.ts`)
  wrap their `pool.query` so **every** app inherits translated errors for free.
- The **action edge** maps the typed error to a plain serializable discriminated
  union routed to the _correct_ field — replacing today's hack of dumping
  `getErrorMessage(error)` into a hard-coded `customer_name`.
- Constraint: the Result that crosses the boundary is plain data
  (`{ ok: false; fieldErrors } | redirect`), never a `neverthrow`-style class.

### (a) Explicit use-case / application layer — ADOPT ON DEMAND ONLY

- Extract an action body into a `.server/*.usecase.ts` **only** when the action
  coordinates a transaction or more than one repository call (e.g. the new-order
  create path, which must become atomic). Do **not** mandate a use-case file per
  action — for single-call CRUD the RR `action` already _is_ the use case, and a
  file per action is indirection with a single caller.

### (b) Repository interfaces over the executors — REJECT (as nominal interfaces)

- The generic executors already are the repository, and the `.server/` boundary is
  a stronger seam than a structural TS interface. A `type OrderRepository` adds a
  nominal contract but no new enforcement and one implementation. It also fights
  ADR-039 if shared cross-package.
- The one part worth taking is threading an optional `tx` through the executors —
  but that belongs to the transaction work in (a), not to an interface. Promoted →
  [ADR-051](../../decisions/ADR-051-with-transaction-and-tx-executor-option.md),
  which types it `ClientBase` rather than `PoolClient`.

### Performance workstream (separate from a/b/c — the actual latency wins)

The abstraction changes are runtime-free-to-cheap but do **not** move latency. The
measurable wins none of them address:

- **P1 — Parallelize data + count.** `selectOrdersPage` awaits `selectRows` then the
  count sequentially; `Promise.all` roughly halves floor latency on count-dominated
  filters. Highest ROI, one-line change.
- **P2 — Compute `total` once per query identity.** Infinite-scroll load-more
  (`LOAD_MORE_PAGE_SIZE`) re-runs `COUNT` over the whole filtered set on every page,
  though `total` never changes within a session. Return it only on the first page.
- **P3 — Keyset pagination for infinite scroll.** The `(sort…, order_id)` total
  order (ADR-008) is already the cursor; replace `OFFSET k` (O(offset)) with
  `WHERE (cols, pk) > (:cursor)` (O(limit)). Keep offset for jump-to-page grids.
- **P4 — Read-model projection.** Define a table-view column set distinct from the
  full detail set; keep large free-text columns out of the list query to shrink the
  serialized payload.
- **P5 — Explicit pool tuning. LANDED.** `getPool` set only credentials, so pg
  defaults applied (`max: 10`, no acquisition/statement timeouts). `max`,
  `connectionTimeoutMillis`, `idleTimeoutMillis` and `statement_timeout` are now
  env-driven through the shared Zod schema, so the process degrades gracefully
  instead of stalling silently.
- **P6 — Optional OpenTelemetry** on the use-case + repository boundaries, **only**
  with head-sampling + a batch/async exporter (a sync, unsampled exporter is itself
  a tail-latency bottleneck).

## Module Boundaries

- **`@lcabrera/server`** — new `errors/` subpath: `map-db-error.util.ts` + one
  `*.error.ts` per typed error + a barrel. This is a **new public surface**: add the
  subpath to both `exports` and `publishConfig.exports` (parity gate) and expect
  `api-surface:verify` to require a changeset. Also the home for a future
  `withTransaction` helper and the `tx?: PoolClient` executor parameter.
- **`.server/<entity>.service.ts`** — stays the repository. Grows transactional
  service functions (e.g. `insertOrderAtomically`) rather than sprouting a parallel
  repository-interface layer.
- **Route `action`/`loader`** — stays the thin controller. Delegates orchestration
  to a `.server/*.usecase.ts` only when atomicity/coordination demands it; otherwise
  calls the service directly.
- **`config/`** — stays the pure domain: schemas, types, derivations. No SQL, no
  `pg`, client-safe.
- **Do not introduce** `dto/`, `mapper/`, `use-cases/`, `repository/` folders — the
  suffix vocabulary already covers these and a parallel dialect raises onboarding
  cost for no enforcement gain.

## Migration Strategy

Incremental, each step shippable on its own, ordered by value and dependency:

1. **Error-translation core (c).** Add `@lcabrera/server` `errors/` + `mapDbError`;
   wrap the write executors. Changeset + api-surface snapshot update. No behavior
   change yet at the edge.
2. **Field-routed Result at the action edge (c).** Replace the `customer_name`
   catch-all in `new-order`/`edit-order` actions with a serializable Result mapping
   the typed error to the correct field. Fixes the mis-routed-error UX defect.
3. **`withTransaction` + atomic create (a + correctness).** Add the transaction
   helper and thread `tx?: PoolClient` through the executors used by create; make
   `getNextOrderId → insertOrder` atomic. Closes the `order_id` race that produces
   the `23505` in the first place. This is where the (a) use-case extraction earns
   its keep.
4. **Perf P1 + P2** (parallelize data+count; compute count once) — small, isolated,
   high ROI.
5. **Perf P5** (pool tuning via env schema) — one workspace, guards behavior under
   load.
6. **Perf P3** (keyset pagination in the query builder, opt-in per view) — larger;
   land behind the existing total-order guarantee.
7. **Perf P4 / P6** (read-model projection; optional sampled OTel) — as capacity
   allows.

Explicitly **not** on the path: nominal repository interfaces (b), entity classes,
a repo-wide `neverthrow` Result object, or a mandated use-case file per action.

## Risks & Mitigations

| Risk                                                                                                                    | Severity                        | Mitigation                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order_id` assigned read-then-write on two connections → PK collision under concurrency, surfacing as unhandled `23505` | **High (live correctness bug)** | Make create atomic via `withTransaction` (step 3); pairs with the error layer so a residual collision becomes a clean typed conflict, not a crash.                                |
| Raw `pg` error detail leaks to the client / lands on the wrong field                                                    | **High**                        | `mapDbError` at the persistence layer + field-routed Result at the action edge (steps 1–2).                                                                                       |
| A Result type returned from a loader/action is a class with methods                                                     | **High (silent)**               | Single-fetch drops functions silently — enforce plain serializable DU by convention + a serialization check in review; keep error _classes_ server-only, map to a DU at the edge. |
| Auth guard commented out on the mutating `enterprise-orders` subtree + both resource routes                             | **High (security)**             | Out of scope for this plan but flagged: re-enable `authMiddleware` in `root.ts` **and** both resource routes before treating the subtree as protected.                            |
| Adopting the blueprint's DDD folders wholesale                                                                          | Medium                          | Rejected by design — suffix system + `.server/` boundary already provide the separation; a use-case file only where coordination demands it.                                      |
| OTel added with a sync/unsampled exporter                                                                               | Medium                          | Head-sample + batch/async exporter only; it must observe the bottlenecks, not become one.                                                                                         |
| Over-fetch across the serialization boundary (full column set shipped per row)                                          | Medium                          | Read-model projection (P4).                                                                                                                                                       |

## Scoring Summary (JSON)

Scores are 0–5. `migrationComplexity` uses the Analyst convention **5 = low
complexity / easy**. `combined` is the equal-weight mean across the six rubric
dimensions; `weighted` applies `{principleAlignment:0.20, feasibility:0.15,
performanceImpact:0.15, developerExperience:0.20, scalability:0.15,
migrationComplexity:0.15}`.

```json
{
  "rubric": [
    "principleAlignment (Architect)",
    "feasibility (Analyst)",
    "performanceImpact (Performance Engineer)",
    "developerExperience (DX Advocate)",
    "scalability (Architect + Performance Engineer)",
    "migrationComplexity (Analyst, 5=easy)"
  ],
  "candidates": {
    "a_use_case_layer": {
      "principleAlignment": 4,
      "feasibility": 5,
      "performanceImpact": 4,
      "developerExperience": 2,
      "scalability": 4,
      "migrationComplexity": 4,
      "combined": 3.83,
      "weighted": 3.75,
      "verdict": "adopt-on-demand",
      "note": "The RR action already is the use case for single-call CRUD; extract only for transactional/multi-repo actions (e.g. atomic create)."
    },
    "b_repository_interfaces": {
      "principleAlignment": 2,
      "feasibility": 3,
      "performanceImpact": 5,
      "developerExperience": 1,
      "scalability": 3,
      "migrationComplexity": 2,
      "combined": 2.67,
      "weighted": 2.55,
      "verdict": "reject",
      "note": "Runtime-free but the .server/ boundary is a stronger seam; one implementation, fights ADR-039 if shared. Take only the tx?: PoolClient executor param, which belongs to (a)."
    },
    "c_error_translation_result": {
      "principleAlignment": 5,
      "feasibility": 4,
      "performanceImpact": 4,
      "developerExperience": 3.5,
      "scalability": 5,
      "migrationComplexity": 4,
      "combined": 4.25,
      "weighted": 4.25,
      "verdict": "adopt",
      "note": "Closes the top-cited gap; correctness/security fix disguised as a refactor. Result must be a plain serializable DU (single-fetch drops functions)."
    }
  },
  "performanceWorkstream": {
    "P1_parallelize_data_count": {
      "performanceImpact": 5,
      "verdict": "adopt",
      "note": "Promise.all; ~halves floor latency on count-dominated filters."
    },
    "P2_compute_count_once": {
      "performanceImpact": 5,
      "verdict": "adopt",
      "note": "Return total only on first page of an infinite-scroll session."
    },
    "P3_keyset_pagination": {
      "performanceImpact": 5,
      "verdict": "adopt",
      "note": "Total order via ADR-008 is already the cursor; O(limit) vs O(offset)."
    },
    "P4_read_model_projection": {
      "performanceImpact": 4,
      "verdict": "adopt",
      "note": "Table-view column set distinct from full detail; shrinks serialized payload."
    },
    "P5_pool_tuning": {
      "performanceImpact": 4,
      "verdict": "adopt",
      "note": "Env-driven max + timeouts; graceful degradation under load."
    },
    "P6_otel_sampled": {
      "performanceImpact": 3,
      "verdict": "optional",
      "note": "Head-sample + batch exporter only; sync/unsampled is itself a bottleneck."
    }
  },
  "ranking": [
    "c_error_translation_result",
    "a_use_case_layer",
    "b_repository_interfaces"
  ]
}
```
