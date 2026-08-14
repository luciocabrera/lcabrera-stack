# API Server Architecture

Express + PostgreSQL backend used by the frontend via `/api` routes.

## Runtime

- Source entry point: `src/server.ts`
- Build output: `dist/server.js`
- HTTP server: Express
- Database client: `pg` (`Pool`)
- Env loading: `node --env-file-if-exists=.env dist/server.js`

## Data Source

Configured by `.env`:

- `CORS_ALLOWED_ORIGINS`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Canonical shared env values are loaded from `../../docker/local/.env`.
Package-local `.env` files are optional and used only as app-specific overrides.

The frontend expects this API on `http://localhost:3001` and proxies `/api`.

## Main Route Groups

- `/api/car-sales`
- `/api/car-sales/paginated`
- `/api/enterprise-orders/paginated`
- `/api/enterprise-orders/distinct/:columnName`
- `/api/enterprise-orders/:orderId`
- `/api/wide-alltypes-150/paginated`

## Operational Guardrails

- Startup should warn when key tables are empty or missing.
- A DB sanity endpoint should expose row-count health for key tables.
- Seeding must be available as a single command from `package.json`.
- Dynamic SQL identifiers must be allowlisted before interpolation.
- Route wiring, request parsing, and database access should live in separate modules.

## Source Layout

TypeScript source lives in `api-server/src/`:

- `app/app.ts` → Express bootstrap and router mounting
- `config/*.schema.ts` and `config/*.util.ts` → env parsing
- `features/*/*.route.ts` → route wiring
- `features/*/*.controller.ts` → HTTP orchestration
- `features/*/*.repository.ts` → PostgreSQL access
- `features/*/*.types.ts` → feature contracts
- `utils/*.util.ts` → shared pure helpers
- `middleware/*.middleware.ts` → shared Express middleware

## Seeding

SQL assets:

- `db/setup_large_data.sql` — `car_sales` and `wide_alltypes_150`, the tables
  both API servers serve. A byte-identical copy lives in
  `apps/react-router/db/`, deliberately
  ([ADR-071](../../docs/decisions/ADR-071-split-the-demo-database-setup.md)):
  change one and change the other in the same commit.

`enterprise_orders` is **not** created here. The showcase owns that table's DDL
(`apps/react-router/db/setup_enterprise_orders.sql`) and seeds it into the same
local database, which is what keeps this workspace's enterprise-order endpoints
working today.

Programmatic entrypoint:

- `scripts/seed-db.mjs` — resolves `psql` from fixed system directories, or pipes
  into the local Postgres container when there is no host `psql`
- `vp run seed`, or `vp run db:seed` to bring the database up first
