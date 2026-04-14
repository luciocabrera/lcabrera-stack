# Scripts Architecture

Shared repository-level automation scripts.

## Purpose

- Centralize operational scripts used by multiple apps.
- Avoid duplicate script logic across packages.
- Keep security-sensitive command execution in one audited place.

## Current Scripts

- `seed-db.cjs` - seeds PostgreSQL using SQL assets in `apps/api-server/db/`.
  - Prefer host `psql` from fixed paths.
  - Fallback to `docker exec` into `postgres_container` when host `psql` is unavailable.

## Root Script Entry Points

Defined in root `package.json`:

- `db:up` - starts local postgres via `docker/local/docker-compose.yml`.
- `db:status` - shows local docker compose status.
- `db:down` - stops local postgres.
- `seed` - runs shared seeding flow through `apps/api-server`.
- `db:seed` - convenience sequence: `db:up` then `seed`.

## Guardrails

- Resolve `psql` only from fixed system locations.
- Resolve `docker` only from fixed system locations when using fallback mode.
- Use a fixed safe `PATH` when spawning subprocesses.
- Require SQL paths to be absolute and derived from repository root.
- Keep script behavior package-agnostic so app scripts can call it via relative path.
