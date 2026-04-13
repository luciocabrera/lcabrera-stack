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
├── errors/
│   └── httpError.ts
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

1. `server.ts` reads env, creates the `pg` pool, builds the Express app, and starts listening.
2. `app/app.ts` mounts feature routers and shared middleware.
3. `*.route.ts` files bind URL paths to controller handlers.
4. `*.controller.ts` files parse query params, validate input, and shape HTTP responses.
5. `*.repository.ts` files execute SQL using typed/allowlisted inputs only.
6. Shared `*.util.ts` helpers provide pure query parsing, serialization, and SQL formatting support.

## Guardrails

- CORS origin checks are allowlist-driven through `CORS_ALLOWED_ORIGINS`.
- Repositories never accept raw query-string JSON.
- Dynamic SQL identifiers are always allowlisted before interpolation.
- Query/value parsing happens before repository calls.
- Errors are normalized through `HttpError` + `error.middleware.ts`.

## Shared Utilities

Common utilities shared across both API server implementations live in `apps/shared`. Currently:

- `serializeDatabaseValue` — Converts PostgreSQL row values (Buffers, nested objects) to JSON-safe response values.

Imports use the `api-shared` package alias for monorepo resolution.
