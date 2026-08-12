# API Server Source Architecture

TypeScript source for the Express + PostgreSQL backend.

## Goals

- Keep `server.ts` as bootstrap-only.
- Split HTTP orchestration, database access, validation, and pure helpers into separate modules.
- Use repo-aligned suffixes:
  - `*.route.ts` for router wiring
  - `*.controller.ts` for request/response orchestration
  - `*.repository.ts` for database IO
  - `*.schema.ts` for runtime validation
  - `*.types.ts` for contracts
  - `*.util.ts` for pure helpers
  - `*.constants.ts` for stable allowlists/defaults

## Layout

```text
src/
├── app/
│   └── app.ts
├── config/
│   ├── env.schema.ts
│   └── env.util.ts
├── constants/
│   └── server.constants.ts
├── features/
│   ├── carSales/
│   ├── dbSanity/
│   ├── enterpriseOrders/
│   └── wideAlltypes150/
├── middleware/
│   └── error.middleware.ts
├── types/
│   └── api.types.ts
├── utils/
│   ├── buildOrderByClause.util.ts
│   ├── delay.util.ts
│   ├── formatPgAdminQuery.util.ts
│   ├── parseJsonQueryParam.util.ts
│   ├── readQueryInteger.util.ts
│   ├── readQueryValue.util.ts
│   └── (serializeDatabaseValue imported from `api-shared`)
└── server.ts
```

## Request Flow

1. `server.ts` reads env, builds the Express app, and starts listening. It holds no pool: every repository reads through `@lcabrera/server` executors, which reach the `getPool()` singleton lazily (created on the first query); shutdown closes it via `closePool()`.
2. `app/app.ts` mounts feature routers and shared middleware.
3. `*.route.ts` files bind URL paths to controller handlers.
4. `*.controller.ts` files parse query params, validate input, and shape HTTP responses.
5. `*.repository.ts` files compose `@lcabrera/server` executors (`selectRows`, `getRowsCount`, `selectFilterOptions`) and its `toQueryFilters` filter mapper from allow-listed inputs — no hand-rolled SQL.
6. Shared `*.util.ts` helpers provide pure query parsing and serialization support.

## Guardrails

- CORS origin checks are allowlist-driven through `CORS_ALLOWED_ORIGINS`.
- Repositories never accept raw query-string JSON.
- Dynamic SQL identifiers are always allowlisted before interpolation.
- Query/value parsing happens before repository calls.
- Errors are normalized through `HttpError` + `error.middleware.ts`.
- **A column filter's vocabulary is validated; its value is not.** `type` and `operator` are closed sets and `enterpriseOrders.schema.ts` checks them strictly. A value is not, because the filter arrives from a table the user is still editing and `@lcabrera/server`'s mappers drop a value that is not there yet rather than rejecting it — a schema stricter than the shared contract rejects requests the React Router route serves (#567). The Zod schema is one of two copies of that contract that cannot be a type, so `enterpriseOrders.schema.test.ts` drives every case in `api-shared`'s `ENTERPRISE_ORDER_FILTER_CONTRACT_CASES` through it and asserts the parsed filters produce the clauses that route would have built. See [ADR-064](../../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md).

## Shared Utilities

Common utilities shared across both API server implementations live in `apps/shared`. Currently:

- `HttpError` — Shared HTTP-aware error class used by config, schema, middleware, and route layers.
- `api.types` — Shared response/pagination/query type contracts.
- `server.constants` — Shared pagination/sanity constants.
- `serializeDatabaseValue` — Converts PostgreSQL row values (Buffers, nested objects) to JSON-safe response values.
- `runStartupDbSanityCheck` — Shared startup logging flow for DB sanity diagnostics.

Imports use the `api-shared` package alias for monorepo resolution.
