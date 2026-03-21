# API Server Architecture

Express + PostgreSQL backend used by the frontend via `/api` routes.

## Runtime

- Entry point: `server.js`
- HTTP server: Express
- Database client: `pg` (`Pool`)
- Env loading: `node --env-file-if-exists=.env server.js`

## Data Source

Configured by `.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

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

## Seeding

SQL assets:

- `db/setup_large_data.sql`
- `db/setup_enterprise_orders.sql`

Programmatic entrypoint:

- `scripts/seed-db.js`
- `npm run seed` (or equivalent via `vp run seed`)
