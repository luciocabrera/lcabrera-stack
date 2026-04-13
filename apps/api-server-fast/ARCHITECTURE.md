# API Server Fast Architecture

Express + PostgreSQL backend optimized for fast local iteration and benchmark scenarios.

## Runtime

- Source entry point: `src/server.ts`
- Build output: `dist/server.js`
- HTTP server: Express
- Database client: `pg` (`Pool`)
- Env loading: `node --env-file-if-exists=.env dist/server.js`

## Data Source

Configured by `.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Seeding

Programmatic entrypoint:

- `scripts/seed-db.js`

SQL assets are reused from `apps/api-server/db/`.

## Operational Guardrails

- Seeding scripts must execute binaries with a fixed safe `PATH`.
- Dynamic SQL identifiers must be allowlisted before interpolation.

## Shared Utilities

Common utilities shared across both API server implementations live in `apps/shared`. Currently:

- `serializeDatabaseValue` — Converts PostgreSQL row values (Buffers, nested objects) to JSON-safe response values.

Imports use the `api-shared` package alias for monorepo resolution.
