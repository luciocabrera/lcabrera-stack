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

- `../../scripts/seed-db.cjs`
- `../../scripts/seed-db.cjs` resolves `psql` from fixed system directories and executes it with a fixed safe `PATH`

SQL assets are reused from `apps/api-server/db/`.

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
