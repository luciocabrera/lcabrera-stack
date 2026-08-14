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

## `setup_large_data.sql` is duplicated on purpose

`apps/api-server/db/setup_large_data.sql` is a copy of this file: both this app
and the car-sales API servers serve `car_sales` and `wide_alltypes_150`, and the
API workspaces are leaving for their own repository (#686), where a path into
this one would not resolve. The alternative — one owner and a cross-repo setup
step — was rejected for the reason
[ADR-039](../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)
gives, and the choice is recorded in
[ADR-071](../../../docs/decisions/ADR-071-split-the-demo-database-setup.md)
along with what the copies do and do not promise each other.

**While both copies live in this repository they are byte-identical, and a change
to one belongs in the other in the same commit.** Confirm with:

```bash
diff apps/react-router/db/setup_large_data.sql apps/api-server/db/setup_large_data.sql
```

After the API workspaces leave, the copies are independent: each repository's
copy is authoritative for its own routes, and neither promises the other's shape.
