---
kind: standard
status: live
recorded: 2026-07-25
issues: []
packages: [ui, api, server, utils, showcase]
---

# TypeScript API Architecture Standard (lcabreara Edition)

> **Status:** Advisory standard, adapted from the framework-agnostic blueprint in
> [`.github/skills/typescript-api-engineering/generic-architecture-standards.md`](../../../.github/skills/typescript-api-engineering/generic-architecture-standards.md)
> to this repo's actual architecture: React Router framework mode (SSR,
> loaders/actions), the public `@lcabrera/{ui,api,server,utils}` packages, and the
> runtime split (browser-safe `api` vs Node-only `server`). Where this edition and
> the blueprint disagree, **this edition wins for code in this repo** — the
> blueprint targets a standalone Express API this app's primary data path does not
> have. Companion document:
> [`architecture-improvement-plan.md`](./architecture-improvement-plan.md).

## Introduction

The blueprint prescribes a classic
`Router → Middleware → Validation → Controller → UseCase → Domain → RepositoryInterface → PostgresRepository`
ladder. In React Router framework mode, the framework **collapses** several of
those rungs:

- **Router + Controller** = the route module's `loader`/`action`.
- **Repository + ORM** = the generic `@lcabrera/server/db` executors bound to a
  target by the `.server/<entity>.service.ts`.
- **Domain** = pure `config/*.util.ts` derivations (not entity classes — the repo's
  FP/immutability rules make the function form idiomatic).

This edition keeps every blueprint _principle_ and expresses it in the repo's
existing suffix vocabulary and its build-enforced `.server/` boundary, which is a
**stronger** guarantee than the blueprint's convention. The reference
implementation is `apps/showcase/src/routes/enterprise-orders/`.

## Core Principles

1. **Dependency rule — inward only.** `loader/action → use-case → service(repo) →
executors → pg`. `config/` (domain) has no downward dependency. The `.server/`
   boundary makes a client→server import a **build failure**, not a lint warning.
2. **One responsibility per layer.** The action owns HTTP; the service owns
   persistence; `config/` owns pure rules. No God Service.
3. **Validation before the controller.** Zod schema in `config/*.schema.ts`; the
   `clientAction` pre-gates in the browser, the server `action` re-validates
   authoritatively. TypeScript types are not validation.
4. **Errors are translated at the persistence layer.** `pg` codes map to typed
   domain errors before they leave `@lcabrera/server`. Raw SQL/schema/stack detail
   never reaches the client.
5. **Multi-step writes are atomic.** A read-then-write that must not interleave
   uses `withTransaction` on a single `PoolClient`.
6. **Domain invariants live in pure functions**, tested in isolation, client-safe.
7. **Anything crossing the loader/action boundary is plain serializable data.**
   React Router single-fetch silently replaces functions with `undefined` — no class
   instances with methods may be returned to the client.
8. **Public-package discipline holds.** The four `@lcabrera/*` packages never
   baseline, scope, or inline-disable a finding; a new subpath is added to both
   `exports` and `publishConfig.exports` and tracked by `api-surface:verify`.

## Layering Rules

| Blueprint layer        | lcabreara home                               | Rule                                                                                                                                                 |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Router / Middleware    | `routes.ts`, route `root.ts`, `middleware[]` | Wiring + auth only; no business logic. Auth guard belongs in `root.ts` **and** every resource route, not just the UI subtree.                        |
| Validation             | `config/*.schema.ts` (Zod)                   | Runs before orchestration; server re-validates even after a client pre-gate.                                                                         |
| Controller             | `loader` / `action`                          | Thin. Owns formData/params/redirect/Response. Delegates orchestration; returns a serializable Result. No SQL, no `pg`.                               |
| Use Case (application) | `.server/*.usecase.ts`                       | **Only when** the action coordinates a transaction or >1 repository call. HTTP-free. Returns a Result DU. Do not create one per trivial CRUD action. |
| Domain                 | `config/*.util.ts`                           | Pure, no side effects, colocated test. Invariants as functions, not classes.                                                                         |
| Repository             | `.server/<entity>.service.ts`                | Binds the generic executors to `{schema, table, allowedColumns}`. No entity-specific SQL. Never imported by client-reachable code.                   |
| Executors              | `@lcabrera/server/db`                        | Parameterized queries only; column allow-listing; the sole place SQL is emitted. Accept optional `tx?: PoolClient`.                                  |
| Database               | `getPool()` → `pg`                           | Node-only; env-driven pool config validated by Zod.                                                                                                  |

**Never** introduce `dto/`, `mapper/`, `use-cases/`, or `repository/` folders — the
suffix vocabulary already names these concerns, and a parallel dialect raises
onboarding cost with no enforcement benefit.

## Naming Conventions

Follow the repo's enforced suffix system (`.claude/rules/typescript.md`,
`local-rules/filename-convention`). Additions this edition introduces:

| Concern                          | Pattern                                              | Case                                    | Example                                |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| Route loader / action            | `*.loader.ts` / `*.action.ts` / `*.clientAction.ts`  | kebab-case                              | `edit-order.action.ts`                 |
| Server-only service (repository) | `*.service.ts` inside `.server/`                     | camelCase                               | `.server/enterpriseOrders.service.ts`  |
| Use case (on demand)             | `*.usecase.ts` inside `.server/`, next to its action | camelCase                               | `.server/createOrder.usecase.ts`       |
| Zod schema                       | `*.schema.ts`                                        | (case not yet gate-enforced)            | `enterpriseOrders.schema.ts`           |
| Pure domain util                 | `*.util.ts` + colocated `*.util.test.ts`             | camelCase (kebab in `@lcabrera/utils`)  | `deriveOrderTotals.util.ts`            |
| DB-error mapper                  | `map-db-error.util.ts`                               | kebab-case (matches `@lcabrera/server`) | `errors/map-db-error.util.ts`          |
| Typed domain error               | `*.error.ts` (one class per file)                    | kebab-case                              | `unique-constraint-violation.error.ts` |

Type suffixes: `Args` for parameter objects, `Props` for component props, `Result`
/ `Return` for return types. All type properties `readonly`; `type`, never
`interface`; never `any`; never an explicit return type unless inference fails.

## API Service Patterns

A service (repository) binds the generic executors to one entity and exposes
typed, SQL-free functions:

```ts
// .server/enterpriseOrders.service.ts  (server-only, node runtime)
const TARGET = {
  schema: SCHEMA_NAME,
  table: TABLE_NAME,
  allowedColumns: ALLOWED,
} as const;

export const selectOrdersPage = async ({
  filters,
  limit,
  offset,
  sort,
}: SelectOrdersPageArgs) => {
  // P1: independent reads run concurrently, not sequentially.
  const [rows, total] = await Promise.all([
    selectRows({ ...TARGET, filters, limit, offset, sort }),
    // P2: skip the COUNT on load-more pages within a scroll session.
    offset === 0
      ? countRows({ ...TARGET, filters })
      : Promise.resolve(undefined),
  ]);
  // Precise hasMore when total is known, fallback to length check on subsequent pages
  const hasMore =
    total !== undefined ? offset + rows.length < total : rows.length === limit;

  return { data: rows, hasMore, total };
};

export const insertOrder = ({ values, tx }: InsertOrderArgs) =>
  insertRow({ ...TARGET, values, tx }); // tx threads a PoolClient for atomic writes
```

A use case (only when coordination/atomicity is required) is HTTP-free and returns
a serializable Result:

```ts
// .server/createOrder.usecase.ts  (server-only, HTTP-free)
export const createOrder = async ({
  input,
  actor,
}: CreateOrderArgs): Promise<CreateOrderResult> =>
  withTransaction(async (tx) => {
    const orderId = (await getMaxOrderId({ tx })) + 1; // read + write share one connection
    const values = toOrderInsertValues({ input, actor, orderId }); // pure domain
    const order = await insertOrder({ values, tx });
    return { ok: true, order };
  });
```

The action stays thin and maps the Result to HTTP:

```ts
// new-order/new-order.action.ts
export const action = async ({ request, context }: ActionArgs) => {
  const parsed = parseOrderFormData(await request.formData());
  if (!parsed.success)
    return { ok: false, fieldErrors: toOrderFieldErrors(parsed.error) };

  const result = await createOrder({
    input: parsed.data,
    actor: context.get(authContext),
  });
  if (!result.ok) return result; // already a serializable DU, field-routed
  return redirect(orderViewPath(result.order));
};
```

## Error Handling

- **Translate at the persistence layer.** `@lcabrera/server` maps `pg`
  `DatabaseError` codes to typed errors and the executors wrap their `pool.query`,
  so every consumer inherits translation:

```ts
// @lcabrera/server: errors/map-db-error.util.ts
export const mapDbError = ({ error }: MapDbErrorArgs): Error => {
  const e = error as DatabaseError;
  if (e?.code === '23505')
    return new UniqueConstraintViolationError(e.constraint);
  if (e?.code === '23503') return new ForeignKeyViolationError(e.constraint);
  return new PersistenceError(e?.message ?? 'Database error');
};
```

- **Map to a serializable Result at the action edge.** The action translates a
  typed error to a plain discriminated union routed to the _correct_ field —
  never dumping a raw message into a hard-coded field, never leaking SQL detail:

```ts
type CreateOrderResult =
  | { readonly ok: true; readonly order: EnterpriseOrder }
  | {
      readonly ok: false;
      readonly fieldErrors: Readonly<Record<string, string>>;
    };
```

- **Never return a class instance across the loader/action boundary.** Keep error
  _classes_ server-only; the client-facing Result is plain data (single-fetch drops
  functions silently).
- **Status errors** (404, etc.) keep using RR's thrown `data(..., { status })`;
  don't wrap them in a parallel Result object.

## Domain Boundaries

- **Domain = pure functions in `config/`.** `deriveOrderTotals`, `toOrderInsertValues`,
  `toOrderFieldErrors` — same input → same output, no `Date.now()`/`Math.random()`,
  no I/O, client-safe, each with a colocated test.
- **No entity classes.** The blueprint's `User.create(...)` invariant-holding
  entity is replaced by pure derivations; this is deliberate under the repo's FP
  rules and must not be "corrected" into classes.
- **`config/` never imports `pg`, `getPool`, or anything under `@lcabrera/server/db`
  at runtime** (type-only imports are fine) — it is client-reachable.
- **The runtime split is a hard boundary.** Persistence implementations are
  Node-only (`@lcabrera/server`, `.server/`). Browser-safe contracts (fetch
  helpers, query-param builders) live in `@lcabrera/api`. A client-safe package may
  only depend on client-safe packages (enforced by `packages/ui`'s
  `check:public-api`).

## Actions/Loaders Integration Rules

1. **Zero `useEffect` for data fetching.** Reads flow through `loader`; writes
   through `action` via `<Form>`/`useFetcher`.
2. **Loaders return fully serializable data** — promises are allowed (return the
   fetch promise _unawaited_ for Suspense streaming, as `createTableRouteLoader`
   does), functions are not (silently dropped). Filter options use the serializable
   descriptor path (ADR-009), not returned functions.
3. **The `action` is the controller** — parse, validate, delegate, map Result to
   `redirect`/`Response`. It must not emit SQL or call `getPool` directly; it calls
   a `.server/` service or use case.
4. **A `clientAction` runs in the browser** and must never import a `.server/`
   module; it pre-gates with the shared Zod schema and defers to `serverAction()`.
5. **Route modules are never `.server`** — they need both graphs; server-only code
   lives in a `.server/` module the route imports.
6. **Client state uses the store-pattern only** (split context + `useSyncExternalStore`).
7. **Pagination**: offset is acceptable for jump-to-page grids; **infinite scroll
   uses keyset** over the `(sort…, order_id)` total order (ADR-008).

## Testing Strategy

- **Domain / pure utils** — unit-tested in isolation, DB-free, colocated
  `*.util.test.ts`. Every derivation and mapper has one.
- **Services (repository)** — unit tests mock `getPool`/executors at the module
  level (DB-free, in `test:unit` / `test:coverage`); a real-Postgres suite stays in
  the full `test` task and is excluded from `test:ci`.
- **Use cases** — tested HTTP-free with a mocked/`tx`-injected repository; assert
  the Result union and the transaction rollback path.
- **Loaders / actions** — test the serialization contract (no functions returned),
  validation branch, and field-routed error mapping (e.g. a mapped `23505` lands on
  the right field). `enterprise-orders.loader.test.ts` is the reference.
- **Error translation** — `map-db-error.util.test.ts` asserts each `pg` code maps to
  the right typed error.
- Import test utilities from `vite-plus/test`, never `vitest` directly (ADR-045).

## Diagrams

### Layered flow (write path)

```
UI (<Form>)
   ↓ submit
clientAction (browser Zod pre-gate)
   ↓ serverAction()
action (HTTP edge: parse, re-validate, read actor)
   ↓ delegate
use-case (.server, HTTP-free, transactional)  ──uses──▶  config/ pure domain (derivations)
   ↓ calls
service / repository (.server, target-bound)
   ↓ calls
executors (@lcabrera/server/db, parameterized SQL, mapDbError)
   ↓
getPool() → PostgreSQL
   ↑ Result<T, E> (plain serializable union) bubbles back to the action → redirect | { fieldErrors }
```

### Dependency direction

```
loader/action ─▶ use-case ─▶ service ─▶ executors ─▶ pg
      └────────────▶ config/ (domain, no downward deps) ◀────────┘
```

### Client / server boundary (build-enforced)

```
CLIENT GRAPH                         ‖  SERVER-ONLY (.server/, @lcabrera/server)
component · config/ · clientAction   ‖  service · usecase · executors · getPool · pg
        loader/action ───────────────╫── import ▶   (reverse import = build failure)
```

## JSON Schema (for API service definitions)

A machine-readable descriptor for an lcabreara service function, adapted from the
blueprint's shape to this repo's runtime split, transaction, and serializable-Result
constraints:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LcabrearaServiceDefinition",
  "type": "object",
  "required": ["name", "runtime", "layer", "inputs", "result", "target"],
  "properties": {
    "name": {
      "type": "string",
      "description": "e.g. selectOrdersPage, createOrder"
    },
    "runtime": {
      "enum": ["server"],
      "description": "persistence is always Node-only"
    },
    "layer": { "enum": ["usecase", "service", "executor"] },
    "httpAware": {
      "type": "boolean",
      "const": false,
      "description": "use cases/services never know HTTP"
    },
    "inputs": {
      "type": "object",
      "description": "typed Args object; all properties readonly"
    },
    "result": {
      "type": "object",
      "description": "plain serializable discriminated union — never a class with methods",
      "required": ["ok"],
      "properties": {
        "ok": { "type": "boolean" },
        "data": { "type": "object" },
        "fieldErrors": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
    "errors": {
      "type": "array",
      "items": {
        "enum": [
          "UniqueConstraintViolation",
          "ForeignKeyViolation",
          "Persistence",
          "NotFound"
        ]
      },
      "description": "typed domain errors mapped from pg codes at the persistence layer"
    },
    "target": {
      "type": "object",
      "required": ["schema", "table", "allowedColumns"],
      "properties": {
        "schema": { "type": "string" },
        "table": { "type": "string" },
        "allowedColumns": { "type": "array", "items": { "type": "string" } }
      }
    },
    "transactional": {
      "type": "boolean",
      "description": "true → accepts tx?: PoolClient and runs inside withTransaction"
    },
    "pagination": {
      "enum": ["none", "offset", "keyset"],
      "description": "keyset for infinite scroll, offset for jump-to-page"
    }
  }
}
```

### Example instance

```json
{
  "name": "createOrder",
  "runtime": "server",
  "layer": "usecase",
  "httpAware": false,
  "inputs": { "input": "EnterpriseOrderValues", "actor": "AuthUser" },
  "result": { "ok": true, "data": "EnterpriseOrder" },
  "errors": ["UniqueConstraintViolation", "Persistence"],
  "target": {
    "schema": "sales",
    "table": "enterprise_orders",
    "allowedColumns": ["order_id", "customer_name", "..."]
  },
  "transactional": true,
  "pagination": "none"
}
```

## Golden Rule

The architecture exists to make the codebase predictable. Every new feature should
fit the existing structure — RR route module as controller, `.server/` service as
repository, `config/` as pure domain — **without inventing a new layer**. Reach for
a use case only when an action needs a transaction or coordinates more than one
repository; reach for the error layer always. Prefer clarity, the existing suffix
vocabulary, and the build-enforced boundary over clever abstractions.
