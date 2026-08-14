# API Server Fast Architecture

Fastify + PostgreSQL backend optimized for fast local iteration and benchmark scenarios.

## Runtime

- Source entry point: `src/server.ts`
- Build output: `dist/server.js`
- HTTP server: Fastify
- Database client: `pg` (`Pool`)
- Env loading: `node --env-file-if-exists=.env dist/server.js`

## Data Source

Configured by `.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Canonical shared env values are loaded from `../../docker/local/.env`.
Package-local `.env` files are optional and used only as app-specific overrides.

## Seeding

Programmatic entrypoint:

- `vp run seed` delegates to `car-sales-api`'s own `seed` by workspace name
  rather than by path — both servers serve the same tables from the same
  database, so there is one seeding entry point for the pair
- that script resolves `psql` from fixed system directories and executes it with a fixed safe `PATH`

The SQL assets belong to `car-sales-api`, which is also the workspace that owns
them once the pair leaves this repository.

## Operational Guardrails

- Seeding scripts must execute binaries with a fixed safe `PATH`.
- Dynamic SQL identifiers must be allowlisted before interpolation.

## Shared Utilities

Common utilities shared across both API server implementations live in `apps/shared`. Currently:

- `HttpError` — Shared HTTP-aware error class used by schema, plugin, and app layers.
- `api.types` — Shared response/pagination/query type contracts.
- `server.constants` — Shared pagination/sanity constants.
- `serializeDatabaseValue` — Converts PostgreSQL row values (Buffers, nested objects) to JSON-safe response values.
- `runStartupDbSanityCheck` — Shared startup logging flow for DB sanity diagnostics.

Imports use the `api-shared` package alias for monorepo resolution.
