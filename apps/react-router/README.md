# vite-react-compiler

React 19 + TypeScript + StyleX + React Router 7 application with SSR support,
built on Vite+.

## Overview

- React 19 with React Compiler
- React Router 7 loaders/actions and SSR
- StyleX-only styling
- Vite+ workflow with task definitions for build, start, and test
- Enterprise-style table implementation with virtualization, persistence, and
  infinite scrolling

## Requirements

- Node.js
- `vp` installed and available on PATH

## Install

```bash
vp install
```

## Main Commands

```bash
# Development app server
vp dev

# Production SSR build
vp run build

# Start production SSR server
vp run start

# Run tests
vp run test

# Watch tests
vp run test:watch

# Full validation
vp check
vp run test

# Custom architectural lint rules (ESLint pass)
vp run lint:eslint:check
```

## Important Command Notes

- Use `vp run build`, not `vp build`, for the production SSR bundle.
- `vp run build` emits `build/server/index.js`.
- `vp run start` serves `build/server/index.js` and rebuilds it if missing.
- Use `vp run test`, not `vp test`, because this repo uses a custom Vitest
  command to avoid the Vite+ built-in test-path issue in this setup.

## Data Sources

**This app serves its own table rows.** Every table route reads Postgres in this
process — through a `.server` service for the first page and its own
`_api/…/paginated` resource route for the load-more — so the whole showcase runs
on a database and nothing else:

```bash
vp run db:up
vp run dev:showcase
```

`VITE_API_URL` points the same routes at an external `car-sales-api` instead.
It is a **build-time** switch: in dev, exporting it is enough
(`vp run dev:external-api` is that path pre-wired), but against a production
build it must be set for `vp run build` — setting it for `vp run start` alone
does nothing, silently. Full map of both paths, the check that tells a built
bundle's two states apart, and why the response shapes are identical:
[`docs/data-sources.md`](docs/data-sources.md).

## Database

This app owns the DDL for every table it queries — `db/setup_large_data.sql`
(`car_sales`, `wide_alltypes_150`) and `db/setup_enterprise_orders.sql`
(`enterprise_orders`) — and seeds itself with them. Nothing outside this
workspace is involved; [`db/README.md`](db/README.md) covers the one file that
is deliberately duplicated with `apps/api-server` and how the copies are kept
from drifting.

Start local PostgreSQL from the monorepo root, then seed:

```bash
vp run db:up
vp run --filter vite-react-compiler seed
# or one-shot bring-up + seed
vp run --filter vite-react-compiler db:seed
```

The seeder creates the database named by `DB_NAME` if it does not exist, then
applies both files (each drops and recreates the tables it owns, so re-running
is how you get back to a known state). It connects with `pg` and needs no
`psql` on the machine — Docker and Node are the whole requirement. It reads the
same five `DB_*` variables the app itself requires and fails naming any that are
missing rather than guessing.

Check database container status with `vp run db:status`, and stop it with
`vp run db:down`.

## API Server

Only needed for the `VITE_API_URL` override above (and for `apps/admin_system`).
When it is running, the dev server proxies `/api` requests to
`http://localhost:3001`.

Start the API server from its workspace:

```bash
vp run --filter car-sales-api start
```

If its responses suddenly return `total: 0`, first check DB sanity:

```bash
curl http://localhost:3001/api/db-sanity
```

It seeds its own copy of the car-sales tables
(`vp run --filter car-sales-api seed`) — that command does **not** create
`enterprise_orders`, which belongs to this app.

### DB Recovery And Backup

Create a backup dump:

```bash
docker exec -i postgres_container pg_dump -U root -d car_sales_db > car_sales_db.dump.sql
```

Restore from a dump:

```bash
cat car_sales_db.dump.sql | docker exec -i postgres_container psql -U root -d car_sales_db
```

Important:

- Avoid `docker compose down -v` unless you intentionally want to delete DB data.
- Keep one stable compose project path/name so Docker reuses the same volume.
- Stop local DB with `vp run db:down`.

## Routes

Key routes currently available:

- `/`
- `/settings`
- `/car-sales`
- `/car-sales-infinite`
- `/enterprise-orders`
- `/wide-alltypes-150`

## Build Output

Production builds generate:

- `build/client/*` for browser assets
- `build/server/index.js` for the SSR server entry

## Project Structure

```text
src/
  auth/
  constants/
  features/
  root/
  routes/
  services/
db/
docs/
scripts/
```

## Quality Gate

Use this sequence before finishing changes:

```bash
vp check
vp run test
```

## Related Docs

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `docs/decisions/ADR-007-barrel-export-boundaries.md`
- `src/routes/enterprise-orders/README.md`
