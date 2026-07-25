# Planning Session — Draft GitHub Issues

> **DRAFT — nothing has been created on GitHub.** Produced by the
> `lcabrera-planner` multi-agent session (Systems Architect + Implementation
> Engineer, orchestrated). IDs `E-*`/`P-*`/`G-*` are **logical planning IDs**, not
> issue numbers — real numbers are assigned at creation by
> `vp run plan:issues`. Every issue follows `.github/ISSUE_TEMPLATE/standard_issue.md`
> (sections 1–8) plus a mandatory **Planning metadata** block per
> `docs/agents/dependency-conventions.md`, `execution-waves.md`,
> `milestone-naming-scheme.md`.
>
> **Label note:** `type:` labels are canonical (`scripts/lib/labels.mjs`). `app:` /
> `pkg:` scope labels are auto-applied to the _PR_ by `labeler.yml` from changed
> workspaces — listed here for planning only. Workspace names:
> `pkg: server`, `pkg: ui`, `app: react-router`.
> No `wave:`/`milestone:` labels exist — waves live in this doc, milestones in
> GitHub Milestones (G-03).

---

## Epics (parents — no implementation work; track children)

### E-1 — `feat(server): epic — @lcabrera/server persistence hardening`

- **Problem:** the persistence layer leaks raw pg detail, has no transaction seam,
  and runs an untuned pool. Children deliver the flagship-package foundation.
- **Children:** P-01, P-02, P-03, P-04, P-05, P-13
- **Metadata:** `type: feature`; `pkg: server`; Milestone **M1→M2**;
  Waves **1–2**. `parent: null`.

### E-2 — `fix(react-router): epic — enterprise-orders correctness & security`

- **Problem:** mis-routed persistence errors, a live `order_id` race, and an
  unguarded mutating subtree. Children consume E-1's abstractions at the app edge.
- **Children:** P-06, P-07, P-14
- **Metadata:** `type: bug`; `app: react-router`; Milestone **M3–M4**;
  Waves **3–4**. `parent: null`.

### E-3 — `perf: epic — read-path performance`

- **Problem:** sequential data+count, count recomputed per page, O(offset) load-more,
  full-column over-fetch.
- **Children:** P-08, P-09, P-10, P-11, P-12
- **Metadata:** `type: perf`; `pkg: server` + `app: react-router`;
  Milestone **M4**; Wave **4** (ADR in Wave 1). `parent: null`.

### E-4 — `chore: epic — self-healing governance`

- **Problem:** governance gaps surfaced by the session (see G-01..G-04).
- **Children:** G-01, G-02, G-03, G-04
- **Metadata:** `type: chore`; Milestone **M1**; Wave **1**. `parent: null`.

### E-5 — `perf(server): epic — observability (optional)`

- **Children:** P-15
- **Metadata:** `type: perf`; `pkg: server`; Milestone **M5**; Wave **5**.
  `parent: null`.

---

## Implementation issues

### P-01 — `docs(server): ADR — DB error-translation + serializable Result contract`

**1. Problem Statement.** Raw `pg` error detail leaks to the client and mis-routes to
a hard-coded field (`new-order.action.ts`, `edit-order.action.ts`). The
decision to translate at the persistence layer and map to a plain serializable DU at
the edge needs to be an enforced ADR before code lands.

**2. Objective.** the `server-error-translation` draft promoted into `docs/decisions/` and added to the
CLAUDE.md ADR map; `architecture-improvement-plan.md` §(c) marked promoted.

**3. Context.** Draft at `docs/agents/planning/adr-drafts/server-error-translation-result-contract.md`. Topology ADR-038,
duplication policy ADR-039, api-surface gate ADR-046.

**4. Reproduction.** Not a bug.

**5. Scope.** _In:_ the ADR document + ADR-map entry. _Out:_ any code (P-02/03/06).

**6. Acceptance Criteria.**

- [ ] the `server-error-translation` draft in `docs/decisions/` with Context/Problem/Options/Decision/Consequences
- [ ] Added to CLAUDE.md ADR map
- [ ] `docs:verify` passes
- [ ] Next-free ADR number confirmed (≥047)

**7. Implementation Notes.** Generalize `admin_system/.../hasPostgresErrorCode.util.ts`
rather than inventing a parallel narrowing.

**8. Related Work.** the `server-error-translation` draft draft; E-1.

**Planning metadata**

```yaml
labels: [type: docs, pkg: server]
milestone: M1 - Foundation
executionWave: Wave 1 - Exploration & ADRs
dependencies:
  { blocking: [P-02, P-06], blockedBy: [], parent: E-1, children: [] }
```

---

### P-02 — `feat(server): errors/ subpath — mapDbError + typed domain errors`

**1. Problem Statement.** No typed DB-error translation exists; consumers hand-roll
SQLSTATE detection (`hasPostgresErrorCode.util.ts`).

**2. Objective.** A node-only `@lcabrera/server/errors` subpath: `map-db-error.util.ts`
(`23505`→`UniqueConstraintViolationError`, `23503`→`ForeignKeyViolationError`, else
`PersistenceError`), one `*.error.ts` per typed error, a barrel, colocated tests.

**3. Context.** New public surface — dual `exports`/`publishConfig.exports`,
`reports/api-surface/server.*` regen, changeset, `INVENTORY.md`. the `server-error-translation` draft.

**4. Reproduction.** Not a bug.

**5. Scope.** _In:_ `packages/server/src/errors/*`, package.json exports maps,
INVENTORY, changeset, api-surface snapshot. _Out:_ wrapping executors (P-03); edge
mapping (P-06).

**6. Acceptance Criteria.**

- [ ] `errors/` subpath resolves via both exports maps (`publish:verify`)
- [ ] `mapDbError` unit-tested for `23505`/`23503`/unknown
- [ ] `api-surface:verify` green with changeset
- [ ] Errors are plain classes usable server-side only

**7. Implementation Notes.** One-util-per-file; each error its own file + test.

**8. Related Work.** the `server-error-translation` draft; P-01, P-03, P-06.

**Planning metadata**

```yaml
labels: [type: feature, pkg: server]
milestone: M2 - Abstractions
executionWave: Wave 2 - Foundational Refactors
dependencies:
  { blocking: [P-03, P-06], blockedBy: [P-01], parent: E-1, children: [] }
```

---

### P-03 — `feat(server): translate pg errors in write executors`

**1. Problem Statement.** `insert-row.util.ts`, `update-rows.util.ts`,
`delete-rows.util.ts`, `get-max-value.util.ts` run raw `pool.query`; driver errors
propagate untranslated.

**2. Objective.** Wrap `pool.query` with `mapDbError` so every consumer inherits
typed errors. **No signature change.**

**3. Context.** the `server-error-translation` draft; depends on P-02's `errors/` subpath.

**4. Reproduction.** Not a bug (enables the fix in P-06).

**5. Scope.** _In:_ the four write executors + tests. _Out:_ public signatures; edge
mapping (P-06).

**6. Acceptance Criteria.**

- [ ] Each write executor throws typed errors on `23505`/`23503`
- [ ] Existing executor tests still pass; new cases added
- [ ] No `exports` change (internal wrap) → confirm api-surface unchanged

**7. Implementation Notes.** Keep the wrap in a small helper; don't duplicate the
try/catch across four files.

**8. Related Work.** the `server-error-translation` draft; P-02, P-06.

**Planning metadata**

```yaml
labels: [type: feature, pkg: server]
milestone: M2 - Abstractions
executionWave: Wave 2 - Foundational Refactors
dependencies:
  { blocking: [P-05, P-06], blockedBy: [P-02], parent: E-1, children: [] }
```

---

### P-04 — `docs(server): ADR — withTransaction + tx?: PoolClient executor param`

**1. Problem Statement.** No transaction seam exists; the atomic-create fix needs a
sanctioned pattern and a documented locking/retry strategy first.

**2. Objective.** the `with-transaction` draft promoted + added to the ADR map.

**3. Context.** Draft at `docs/agents/planning/adr-drafts/with-transaction-and-tx-param.md`. Note the
READ-COMMITTED subtlety: transaction alone does not close the race.

**4. Reproduction.** Not a bug.

**5. Scope.** _In:_ the ADR. _Out:_ code (P-05, P-07).

**6. Acceptance Criteria.**

- [ ] the `with-transaction` draft in `docs/decisions/` + ADR map
- [ ] Documents the chosen atomicity strategy (`FOR UPDATE`/advisory lock /
      retry-on-`23505` / sequence) as the decision P-07 must follow

**7. Implementation Notes.** Recommend a real sequence as the long-term follow-up.

**8. Related Work.** the `with-transaction` draft; E-1, P-05, P-07.

**Planning metadata**

```yaml
labels: [type: docs, pkg: server]
milestone: M1 - Foundation
executionWave: Wave 1 - Exploration & ADRs
dependencies:
  { blocking: [P-05, P-07], blockedBy: [], parent: E-1, children: [] }
```

---

### P-05 — `feat(server): withTransaction helper + tx threading`

**1. Problem Statement.** Write executors are hard-wired to the pool singleton; no
`PoolClient` seam exists, so no multi-step write can be atomic.

**2. Objective.** `with-transaction.util.ts` (BEGIN/COMMIT/ROLLBACK over a
`PoolClient`) + optional `tx?: PoolClient` threaded through `insert-row`,
`update-rows`, `get-max-value`, `select-rows` (fallback to `getPool()`).

**3. Context.** the `with-transaction` draft. Additive signature change = api-surface event. Removes the
hand-rolled `runMigrations.ts` BEGIN/ROLLBACK duplication.

**4. Reproduction.** Not a bug (unblocks P-07).

**5. Scope.** _In:_ new helper, executor `tx?` param, dual exports, INVENTORY,
changeset, api-surface snapshot, tests. _Out:_ the enterprise-orders use-case (P-07).

**6. Acceptance Criteria.**

- [ ] `withTransaction` commits on success, rolls back + releases on throw (tested)
- [ ] `tx?` is optional and backward compatible (existing callers unchanged)
- [ ] `api-surface:verify` green with changeset (additive)

**7. Implementation Notes.** `tx?` on the descriptor types
(`query-builder.types.ts`), not a positional arg.

**8. Related Work.** the `with-transaction` draft; P-03 (shared executor edits), P-07.

**Planning metadata**

```yaml
labels: [type: feature, pkg: server]
milestone: M2 - Abstractions
executionWave: Wave 2 - Foundational Refactors
dependencies:
  { blocking: [P-07], blockedBy: [P-04, P-03], parent: E-1, children: [] }
```

---

### P-06 — `feat(react-router): field-routed serializable Result at action edge`

**1. Problem Statement.** Both mutating actions dump `getErrorMessage(error)` onto a
hard-coded `customer_name` field (`new-order.action.ts`,
`edit-order.action.ts`) — mis-routed errors + raw pg text to the client.

**2. Objective.** Map the typed error (from P-02/P-03) to a plain serializable DU
`{ ok: false; fieldErrors }` routed to the correct field (e.g. `order_number` for a
unique collision). Extract the shared mapping (the two catch blocks are duplicates).

**3. Context.** the `server-error-translation` draft. `config/toOrderFieldErrors.util.ts` today maps only
`ZodError`. DU must be plain data (single-fetch drops functions).

**4. Reproduction.**

1. Create an order with a duplicate `order_number`.
2. Expected: error under the `order_number` field, generic message.
3. Actual: raw pg message under the `customer_name` field.

**5. Scope.** _In:_ both action files, `config/toOrderFieldErrors.util.ts`,
`config/enterpriseOrders.types.ts`. _Out:_ the atomic fix (P-07) — this makes a
residual collision a clean typed conflict.

**6. Acceptance Criteria.**

- [ ] Unique-collision error routes to `order_number`, not `customer_name`
- [ ] No raw pg message reaches the client
- [ ] Shared mapping extracted once; both actions consume it
- [ ] Returned Result is a plain serializable DU (no class/methods)

**7. Implementation Notes.** Keep error classes server-side; convert to DU at the edge.

**8. Related Work.** the `server-error-translation` draft; P-02, P-03, P-07.

**Planning metadata**

```yaml
labels: [type: feature, app: react-router]
milestone: M3 - Cross-App Integration
executionWave: Wave 3 - Cross-App Improvements
dependencies:
  { blocking: [P-07], blockedBy: [P-02, P-03], parent: E-2, children: [] }
```

---

### P-07 — `fix(react-router): atomic order create via use-case + withTransaction`

**1. Problem Statement.** `order_id = MAX+1` is read then inserted on two connections
(`new-order.action.ts` → `getNextOrderId` + `insertOrder`); concurrent creates
collide on the PK → unhandled `23505`. **Live High-severity correctness bug.**

**2. Objective.** `.server/createOrder.usecase.ts` runs `getMaxOrderId → insertOrder`
on one `tx`; service functions accept `tx`; `new-order.action.ts` delegates.

**3. Context.** the `with-transaction` draft. **Transaction alone is insufficient under READ COMMITTED** —
implement the locking/retry strategy chosen in the `with-transaction` draft (`FOR UPDATE`/advisory lock,
or retry on the typed `23505` from P-06, or migrate to a sequence).

**4. Reproduction.**

1. Fire two concurrent create requests with the same derived `MAX`.
2. Expected: both succeed with distinct ids, or one gets a clean typed conflict.
3. Actual: second `INSERT` throws unhandled `23505` → `customer_name` catch-all.

**5. Scope.** _In:_ new usecase, `.server/enterpriseOrders.service.ts`,
`new-order.action.ts`. _Out:_ edit path; a full sequence migration (follow-up).

**6. Acceptance Criteria.**

- [ ] Concurrent creates cannot produce a duplicate `order_id` (test / documented lock)
- [ ] A residual conflict surfaces as a typed conflict, not a crash
- [ ] Chosen atomicity strategy documented per the `with-transaction` draft
- [ ] Use-case introduced only for this transactional path

**7. Implementation Notes.** Highest-risk item — pick locking vs retry deliberately.

**8. Related Work.** the `with-transaction` draft; P-05, P-06.

**Planning metadata**

```yaml
labels: [type: bug, app: react-router]
milestone: M3 - Cross-App Integration
executionWave: Wave 3 - Cross-App Improvements
dependencies:
  { blocking: [], blockedBy: [P-05, P-06], parent: E-2, children: [] }
```

---

### P-08 — `perf(react-router): parallelize page data + count (P1)`

**1. Problem Statement.** `selectOrdersPage` awaits `selectRows` then the count
sequentially (`.server/enterpriseOrders.service.ts`); the two are independent.

**2. Objective.** `Promise.all([selectRows(...), count(...)])` — ~halves floor
latency on count-dominated filters.

**3. Context.** Plan §P1. One-function change, enterprise-orders-local.

**4. Reproduction.** Not a bug (latency).

**5. Scope.** _In:_ `selectOrdersPage`. _Out:_ count-once (P-09), keyset (P-11).

**6. Acceptance Criteria.**

- [ ] Data + count run concurrently
- [ ] Existing service tests pass; result identical

**7. Implementation Notes.** Trivial; land first in the perf wave.

**8. Related Work.** E-3; P-09.

**Planning metadata**

```yaml
labels: [type: perf, app: react-router]
milestone: M4 - Hardening & QA
executionWave: Wave 4 - Hardening & QA
dependencies: { blocking: [], blockedBy: [], parent: E-3, children: [] }
```

---

### P-09 — `perf(react-router): compute total once per scroll session (P2)`

**1. Problem Statement.** Infinite-scroll load-more re-runs `COUNT` over the whole
filtered set on every page though `total` never changes within a session.

**2. Objective.** Return `total` only when `offset === 0`; client keeps prior total.

**3. Context.** Plan §P2. Needs a first-page signal threaded
`parseOrdersPageParams → paginated loader → selectOrdersPage`; `total` becomes
optional on the response type.

**4. Reproduction.** Not a bug (latency).

**5. Scope.** _In:_ `.server/enterpriseOrders.service.ts`,
`api/enterprise-orders-paginated/enterprise-orders-paginated.loader.ts`,
`fetchOrdersPage.service.ts`, `config/enterpriseOrders.types.ts`. _Out:_ keyset.

**6. Acceptance Criteria.**

- [ ] `COUNT` runs only on the first page of a session
- [ ] Client retains total across subsequent pages
- [ ] `total` typed optional; consumers updated

**7. Implementation Notes.** Same file as P-08 — sequence after it (soft dep).

**8. Related Work.** E-3; P-08.

**Planning metadata**

```yaml
labels: [type: perf, app: react-router]
milestone: M4 - Hardening & QA
executionWave: Wave 4 - Hardening & QA
dependencies: { blocking: [], blockedBy: [P-08], parent: E-3, children: [] }
```

---

### P-10 — `docs(server): ADR — keyset pagination for infinite scroll`

**1. Problem Statement.** `OFFSET k` load-more is O(offset); a keyset cursor over the
ADR-008 total order is O(limit) but needs a sanctioned decision.

**2. Objective.** the `keyset-pagination` draft promoted + ADR map entry.

**3. Context.** Draft at `docs/agents/planning/adr-drafts/keyset-pagination-infinite-scroll.md`; cursor = ADR-008
`(sort…, order_id)`.

**4. Reproduction.** Not a bug.

**5. Scope.** _In:_ the ADR. _Out:_ code (P-11).

**6. Acceptance Criteria.**

- [ ] the `keyset-pagination` draft in `docs/decisions/` + ADR map
- [ ] Keeps offset for jump-to-page; keyset for infinite scroll

**7. Implementation Notes.** Builder must reject keyset without a total order.

**8. Related Work.** the `keyset-pagination` draft draft; ADR-008; P-11.

**Planning metadata**

```yaml
labels: [type: docs, pkg: server]
milestone: M1 - Foundation
executionWave: Wave 1 - Exploration & ADRs
dependencies: { blocking: [P-11], blockedBy: [], parent: E-3, children: [] }
```

---

### P-11 — `perf(server): keyset pagination in query builder (P3)`

**1. Problem Statement.** The query builder only supports `OFFSET`.

**2. Objective.** Opt-in keyset `WHERE (cols, pk) > (:cursor)` in
`build-select-query.util.ts`, `build-where-clause.util.ts`, `query-builder.types.ts`;
wire into the paginated route.

**3. Context.** the `keyset-pagination` draft. New capability = api-surface event (dual exports, snapshot,
changeset).

**4. Reproduction.** Not a bug (latency).

**5. Scope.** _In:_ the three builder files + paginated route wiring + tests. _Out:_
jump-to-page grids (stay on offset).

**6. Acceptance Criteria.**

- [ ] Keyset opt-in; offset still the default
- [ ] Builder rejects keyset without a total order
- [ ] `api-surface:verify` green with changeset

**7. Implementation Notes.** Larger change; land behind ADR-008's guarantee.

**8. Related Work.** the `keyset-pagination` draft; P-10.

**Planning metadata**

```yaml
labels: [type: perf, pkg: server]
milestone: M4 - Hardening & QA
executionWave: Wave 4 - Hardening & QA
dependencies: { blocking: [], blockedBy: [P-10], parent: E-3, children: [] }
```

---

### P-12 — `perf(react-router): read-model projection for list view (P4)`

**1. Problem Statement.** `selectOrdersPage` ships the full `ENTERPRISE_ORDER_COLUMNS`
per row, including large free-text columns not shown in the list.

**2. Objective.** A distinct `ENTERPRISE_ORDER_LIST_COLUMNS` used by the list query,
shrinking the serialized payload.

**3. Context.** Plan §P4. Reusable pattern for any table-backed route.

**4. Reproduction.** Not a bug (payload size).

**5. Scope.** _In:_ `config/enterpriseOrders.constants.ts`,
`.server/enterpriseOrders.service.ts`. _Out:_ detail view (keeps full set).

**6. Acceptance Criteria.**

- [ ] List query selects only list columns
- [ ] Detail view unchanged
- [ ] Payload size reduced (documented before/after in the PR)

**7. Implementation Notes.** Candidate `PATTERNS.md` entry if it generalizes.

**8. Related Work.** E-3.

**Planning metadata**

```yaml
labels: [type: perf, app: react-router]
milestone: M4 - Hardening & QA
executionWave: Wave 4 - Hardening & QA
dependencies: { blocking: [], blockedBy: [], parent: E-3, children: [] }
```

---

### P-13 — `feat(server): pool-tuning env schema (P5)`

**1. Problem Statement.** `getPool` sets credentials only
(`get-pool.util.ts`); pg defaults (`max:10`, no timeouts) apply, so the process
stalls silently under load.

**2. Objective.** Add `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`,
`DB_IDLE_TIMEOUT_MS`, `DB_STATEMENT_TIMEOUT_MS` (Zod, optional + defaults) to
`env.schema.ts`; wire into `new Pool`.

**3. Context.** the `pool-tuning` draft. Single shared `getPool` → every Node consumer benefits.

**4. Reproduction.** Not a bug (resilience).

**5. Scope.** _In:_ `env.schema.ts`, `get-pool.util.ts`, `.env.example`, INVENTORY,
changeset. _Out:_ per-app overrides.

**6. Acceptance Criteria.**

- [ ] Four tuning keys validated + optional with safe defaults
- [ ] Passed into `new Pool`; existing envs still boot
- [ ] `.env.example` documents them

**7. Implementation Notes.** Additive → not breaking.

**8. Related Work.** the `pool-tuning` draft; E-1.

**Planning metadata**

```yaml
labels: [type: feature, pkg: server]
milestone: M2 - Abstractions
executionWave: Wave 2 - Foundational Refactors
dependencies: { blocking: [], blockedBy: [], parent: E-1, children: [] }
```

---

### P-14 — `fix(react-router): re-enable auth guard on enterprise-orders subtree + resource routes`

**1. Problem Statement.** `authMiddleware` is commented out in
`enterprise-orders/root.ts` and `api/enterprise-orders-paginated/root.ts`; the
delete action only checks `intent`. The entire mutating subtree **and** the DB-backed
read/delete endpoints are publicly reachable. **High-severity security.**

**2. Objective.** Root-cause the fetcher→`/login` HTML-instead-of-JSON navigation
break (guard should return **401 JSON** for `_api` routes, not an HTML redirect),
then re-enable `middleware = [authMiddleware]` on all three entry points.

**3. Context.** Plan Risks table (flagged out of scope of the plan, but the most
serious live exposure). `authMiddleware.ts` + tests already exist.

**4. Reproduction.**

1. Without a session, request the paginated loader / delete action directly.
2. Expected: 401.
3. Actual: the service runs; data returned / row deleted.

**5. Scope.** _In:_ `enterprise-orders/root.ts`,
`api/enterprise-orders-paginated/root.ts`, the delete resource route,
`auth/authMiddleware.ts`. _Out:_ app-wide auth redesign.

**6. Acceptance Criteria.**

- [ ] `_api` routes return 401 JSON when unauthenticated (client nav no longer breaks)
- [ ] Guard re-enabled on all three entry points
- [ ] A test covers the unauthenticated 401 on each entry point

**7. Implementation Notes.** Do **not** re-add the export without fixing the
navigation break — that reintroduces the original regression.

**8. Related Work.** E-2; `react-router-framework-mode` skill.

**Planning metadata**

```yaml
labels: [type: bug, app: react-router]
milestone: M4 - Hardening & QA
executionWave: Wave 4 - Hardening & QA
dependencies: { blocking: [], blockedBy: [], parent: E-2, children: [] }
```

---

### P-15 — `perf(server): optional sampled OpenTelemetry (P6)` _(optional)_

**1. Problem Statement.** No tracing on the use-case/repository boundaries.

**2. Objective.** Optional OTel on those boundaries, **head-sampling + batch/async
exporter only** (a sync/unsampled exporter is itself a tail-latency bottleneck).

**3. Context.** Plan §P6, verdict _optional_. Depends on the transaction/use-case
seams existing.

**4. Reproduction.** Not a bug.

**5. Scope.** _In:_ instrumentation on `withTransaction` + repository calls. _Out:_
full app-wide tracing.

**6. Acceptance Criteria.**

- [ ] Head-sampling configured; batch exporter only
- [ ] Off by default; opt-in via env
- [ ] No measurable overhead when disabled

**7. Implementation Notes.** Only if capacity allows.

**8. Related Work.** E-5; P-05, P-07.

**Planning metadata**

```yaml
labels: [type: perf, pkg: server]
milestone: M5 - Release Prep
executionWave: Wave 5 - Final Integration
dependencies:
  { blocking: [], blockedBy: [P-05, P-07], parent: E-5, children: [] }
```

---

## Governance-gap issues

### G-01 — `docs: reconcile issue template with the dependency convention`

**Problem.** `docs/agents/dependency-conventions.md` says **every** issue must carry a
`dependencies: {blocking, blockedBy, parent, children}` block, but
`.github/ISSUE_TEMPLATE/standard_issue.md` has no such section — so the convention is
unenforceable and unfilled in practice.
**Objective.** Add the `dependencies` YAML block to the issue template (or downgrade
the convention to match), and decide whether `coordination:verify` should check it.
**Acceptance.** Template and convention agree; a new issue prompts for dependencies.
**Metadata.** `labels: [type: docs]`; M1; Wave 1; `parent: E-4`.

### G-02 — `docs(tooling): add ADR _TEMPLATE.md + scaffold`

**Problem.** `docs/decisions/` holds no `_TEMPLATE.md` (confirmed absent); ADRs are
authored freehand. ADR-048 settled the taxonomy and `vp run adr:verify` now checks
placement, naming and numbering — a template would carry the section shape the gate
does not check.
**Objective.** Create an ADR `_TEMPLATE.md` under `docs/decisions/`
(Context/Problem/Options/Decision/Consequences/References), pointing at ADR-048 for
placement and at the grandfathered ADR-001..012 range.
**Acceptance.** Template exists; the four promoted ADRs (047–050) use it.
**Metadata.** `labels: [type: docs]`; M1; Wave 1; `parent: E-4`.

### G-03 — `chore: register M1–M5 GitHub Milestones`

**Problem.** `milestone-naming-scheme.md` defines M1–M5 but the GitHub Milestones are
not confirmed created; every issue here references a milestone that may not exist.
**Objective.** Create Milestones `M1 - Foundation` … `M5 - Release Prep`.
**Acceptance.** Five milestones exist with the exact names in the scheme.
**Metadata.** `labels: [type: chore]`; M1; Wave 1; `parent: E-4`. _(Do first — issue
creation assigns these.)_

### G-04 — `docs: cross-app abstraction guideline`

**Problem.** The "extract into a flagship package vs duplicate per ADR-039" decision
boundary is scattered across `.github/skills/typescript-api-engineering/*` and
ADR-038/039/040; Wave-2/3 work needs one anchor.
**Objective.** A new `cross-app-abstraction.md` under `docs/agents/` — when to extract into
`@lcabrera/server`/`utils` vs duplicate, with the ADR-039 tie-breaker.
**Acceptance.** Doc exists and is linked from the skill + CLAUDE.md.
**Metadata.** `labels: [type: docs]`; M1; Wave 1; `parent: E-4`.
