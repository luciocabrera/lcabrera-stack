# ADR-071 — Split the demo database setup

**Status:** Accepted

## Context

The demo schema lived in one place: `apps/api-server/db/`, applied by a root
script (`scripts/seed-db.cjs`) that named both files by path. That was coherent
while the API servers were the only thing that talked to Postgres.

Two changes broke it. [ADR-070](../../apps/react-router/docs/decisions/ADR-070-showcase-serves-its-own-table-rows.md)
made the showcase serve `car_sales` and `wide_alltypes_150` from its own
process, joining `enterprise_orders`, which it already served — so the showcase
now queries every table in that directory. And #686 moves `apps/api-server`,
`apps/api-server-fast` and `apps/shared` to their own repository, which takes
the directory with them.

The result would have been a showcase whose `/enterprise-orders`,
`/car-sales`, `/car-sales-infinite` and `/wide-alltypes-150` routes have no
tables to query, breaking with no visible connection to the change that broke
them, plus a root seeding script pointing into a directory that no longer exists.

## Decision

Each side owns the DDL for the tables it serves, and each side can seed with
nothing else present.

- `apps/react-router/db/setup_enterprise_orders.sql` — **moved** here. Only the
  showcase serves `enterprise_orders`.
- `apps/react-router/db/setup_large_data.sql` — a **copy**.
  `apps/api-server/db/setup_large_data.sql` stays where it is. Both sides serve
  `car_sales` and `wide_alltypes_150`.
- `apps/react-router/scripts/seed-db.mjs` — the showcase's runner. It creates
  `DB_NAME` if absent and applies both files through `pg`, so seeding the
  showcase needs Docker and Node and no `psql`. Run it with
  `vp run --filter vite-react-compiler seed` (or `db:seed` to bring the
  database up first).
- `apps/api-server/scripts/seed-db.mjs` — the API side's runner, the former root
  script, now resolving its one SQL file inside its own workspace. It keeps the
  host-`psql`-or-container behaviour it always had.
  `car-sales-api-fast`'s `seed` delegates to it by workspace name rather than by
  path, so both API workspaces travel to the new repository intact and nothing
  in this repository names a path under `apps/api-server/`.

The `\timing on` line at the head of each SQL file is gone. It is a `psql`
meta-command, and removing it is what lets any client apply these files; nothing
else in them is client-specific.

`docker/local/nestjs_backup.sql` is deleted — see below for the check.

## Consequences

**Two copies of `setup_large_data.sql` can drift, and nothing outside this
repository will notice.** That is the accepted cost of the alternative below.
The handling has two phases:

1. **While both copies are in this repository** they are byte-identical, and a
   change to one belongs in the other in the same commit
   (`diff apps/react-router/db/setup_large_data.sql apps/api-server/db/setup_large_data.sql`).
   `apps/react-router/db/README.md` states this where an editor will see it.
2. **After #691 moves the API workspaces out**, the copies are independent. Each
   repository's copy is authoritative for its own routes and neither promises the
   other's shape. This is deliberate: the two serve different consumers, and a
   shape that has to satisfy both is exactly the undeclared edge ADR-039 rejects.
   Nothing enforces equality across the repository boundary, and nothing should
   pretend to.

**The API side no longer creates `enterprise_orders`.** `apps/api-server` still
has enterprise-order endpoints, and in this repository they keep working because
the showcase seeds that table into the same database. In the extracted repository
they will not, until it either brings its own DDL or drops those endpoints —
a call for #692, not for this split.

**Seeding is now two commands, one per side**, where it used to be one that
happened to create everything. Someone who runs only the API server's seed and
then opens `/enterprise-orders` gets an empty table rather than an error about a
missing one. The showcase's own seed is the one the README and COMMANDS.md point
at.

**Sonar's exclusion list is now wrong until the UI is updated.**
`**/apps/api-server/db/**` no longer covers the moved files;
`.sonarcloud.properties` records the entry the UI needs (it is a mirror — the UI
is the source of truth, so this file alone cannot fix it).

## Alternatives considered

1. **One owner for `setup_large_data.sql`, the other repository documents a
   dependency.** No drift, but the dependency only resolves for someone who has
   checked out both repositories, and a setup step that reaches across a
   repository boundary is the failure ADR-039 was written about. Rejected.
2. **One runner, shared.** A single seeding script parameterised by SQL path,
   called by both sides. It removes the duplication but leaves the API side with
   no runner at all once it moves — the thing this issue exists to prevent.
   Rejected.
3. **Publish the seeding runner in `@lcabrera/server`** so both repositories
   consume it from npm. Rejected: the runner reads files and (on the API side)
   spawns processes, and that package is public and takes no lint suppressions —
   `security/detect-non-literal-fs-filename` and `detect-child-process` would have
   to be answered in a package whose job is queries, for a dev-time convenience.
4. **Keep `docker/local/nestjs_backup.sql`.** Rejected on evidence, recorded here
   because "nothing greps for it" alone would not have been enough. The dump
   creates `customers`, `invoices`, `invoice_details`, `people`,
   `people_addresses`, `people_emails`, `people_phones`, `products`, `titles`,
   `document_types`, `settings`, `users` and the `knex_migrations` bookkeeping
   pair. Checked on 2026-08-14, in the tree that still had it:
   - No source file names any of those tables — searched for each name both in a
     SQL position (`FROM`/`JOIN`/`INTO`/`UPDATE`/`TABLE`) and as a bare string
     literal, across `.ts`, `.tsx`, `.mjs`, `.cjs`, `.json` and `.sql`. The only
     hits were UI copy ("table settings") and SQL-injection test fixtures
     (`'id; DROP TABLE users'`).
   - **The dynamic case**: table names do reach `@lcabrera/server`'s query
     builders as interpolated identifiers, so the grep above is not sufficient on
     its own. Every such name comes from a curated constant —
     `SANITY_TABLES`, `DISTINCT_SOURCES`, `ENTERPRISE_ORDERS_TABLE` and the
     route configs — and each of those lists holds only `car_sales`,
     `enterprise_orders` and `wide_alltypes_150`. No name is assembled from
     request input.
   - Nothing applies it: the compose file mounts no SQL and has no
     `docker-entrypoint-initdb.d`, and the seeding scripts named only the two
     files in `apps/api-server/db/`. The running local database confirms it —
     `car_sales_db` contains exactly `car_sales`, `enterprise_orders` and
     `wide_alltypes_150`, so the dump had never been applied.

## References

- Issue #689, epic #686
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — duplicate rather than
  depend on an edge that resolves in only one place
- [ADR-070](../../apps/react-router/docs/decisions/ADR-070-showcase-serves-its-own-table-rows.md) — why the showcase
  queries these tables at all
- [`apps/react-router/db/README.md`](../../apps/react-router/db/README.md)
