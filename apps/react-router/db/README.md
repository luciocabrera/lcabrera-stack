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

Neither file uses a `psql` meta-command. That is what lets the seeder apply them
through `pg`, so seeding needs no `psql` on the machine.

## `setup_large_data.sql` has a copy in another repository

The car-sales API servers serve `car_sales` and `wide_alltypes_150` from their
own copy of this file. They left for
[`api-playground`](https://github.com/luciocabrera/api-playground) under #686,
taking it with them. The alternative — one owner and a cross-repo setup step —
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
