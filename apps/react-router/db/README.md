# Showcase database setup

The DDL for every table this app queries. `../scripts/seed-db.mjs` applies both
files in the order listed below; see [`../README.md`](../README.md#database) for
the commands.

| File                          | Creates                          | Queried by                                                |
| ----------------------------- | -------------------------------- | --------------------------------------------------------- |
| `setup_large_data.sql`        | `car_sales`, `wide_alltypes_150` | `/car-sales`, `/car-sales-infinite`, `/wide-alltypes-150` |
| `setup_enterprise_orders.sql` | `enterprise_orders`              | `/enterprise-orders`                                      |

Each file drops and recreates what it owns and generates its rows, so applying
one is how you return to a known state rather than something to run once.

No file here uses a `psql` meta-command. That is what lets the seeder apply them
through `pg`, so seeding needs no `psql` on the machine — and it holds for the
opt-in fixture below too, which the seeder does not apply but which must remain
something it could apply.

## `seed_olap_drill.sql` — an opt-in fixture, not part of the reset

`seed_olap_drill.sql` **appends** to `enterprise_orders` instead of recreating
it, so it is deliberately absent from `SQL_FILENAMES` in
[`../scripts/seed-db.mjs`](../scripts/seed-db.mjs): applying it is a choice, not
part of returning to a known state, and it changes every group count the base
seed produces.

It exists because `setup_enterprise_orders.sql` derives every dimension from one
`generate_series` counter, which correlates them — each (category, subcategory,
customer type) cell holds exactly one customer, so a fourth group key on
`customer_name` changes nothing, and every leaf group is far past a page. The
fixture draws each dimension from an independently salted hash with a customer
pool that widens by category, which is what makes a drill's "fits in one page"
path reachable at all. The file's own header carries the detail.

Run it as many times as you like: each run reads the current high-water mark and
appends a fresh batch after it. Stacking batches multiplies every leaf group, so
drill against a single batch's id range when the size spread is what you are
testing.

```sh
docker exec -i <container> psql -U <user> -d <db> < apps/react-router/db/seed_olap_drill.sql
```

To undo, delete by customer id — every appended row carries `900000 + <pool
slot>` and the base seed's customer ids sit far below that, so this removes the
appended batches however many there are, without depending on the base seed's
row count:

```sql
DELETE FROM enterprise_orders WHERE customer_id >= 900000;
```

## `setup_large_data.sql` has a copy outside this repository

This file is the showcase's own DDL for `car_sales` and `wide_alltypes_150`, and
it is all the showcase needs — nothing here reads the other copy, so editing this
one is complete on its own. A second copy exists outside this repository, held by
the external API servers that also serve those tables; it is beyond reach of any
check here. The alternative — one owner and a cross-repo setup step —
was rejected for the reason
[ADR-039](../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)
gives, and the choice is recorded in
[ADR-071](../../../docs/decisions/ADR-071-split-the-demo-database-setup.md).

**The two copies are now independent, and nothing checks that they agree.**
While both lived here a `diff` kept them byte-identical in the same commit; that
is no longer possible, and it is not meant to be. Each repository's copy is
authoritative for its own routes and neither promises the other's shape, so a
change here does **not** imply a change there — decide deliberately whether the
other side needs it.
