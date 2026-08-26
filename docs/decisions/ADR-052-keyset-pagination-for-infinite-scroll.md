# ADR-052 — Keyset pagination for infinite scroll; `OFFSET` stays for jump-to-page

**Status:** Accepted

## Context

Infinite-scroll load-more paginates with `OFFSET k`
(`selectOrdersPage` → `buildSelectQuery`), which is O(offset): Postgres walks and
discards `k` rows before it returns the first row of the page. The cost grows
linearly with how far the user has scrolled, for no functional reason —
[ADR-008 (primary-key sort tiebreaker)](../../apps/react-router/docs/decisions/ADR-008-primary-key-sort-tiebreaker.md)
already appends the primary key to every server sort, so the rows come back in a
**total order** and a stable cursor exists whether or not anything uses one.

The builder had no way to express one. `SelectQueryDescriptor` offered `limit`
and `offset` and nothing else, so every paginated read in the repo was O(offset)
by construction.

## Problem

Deep pages get progressively slower, and the guarantee that would make them O(limit)
is already in place and unused.

## Options considered

1. **Keep `OFFSET` everywhere.** Simple, and wrong for the one access pattern
   that dominates this app.
2. **Keyset everywhere; drop `offset`.** Breaks jump-to-page grids, which need
   random access and cannot produce a cursor for a page they have never fetched.
3. **Keyset for infinite scroll; keep `OFFSET` for jump-to-page.** Chosen.

## Decision

`SelectQueryDescriptor` gains an optional `cursor`. When present the builder
emits a **seek predicate** — "the rows that sort strictly after this row" — and
the page costs O(limit) instead of O(offset). When absent nothing changes:
`OFFSET` remains the default and the emitted SQL is byte-identical to before.

```ts
buildSelectQuery({
  cursor: { uniqueColumn: 'order_id', values: ['2026-01-04', 4821] },
  fields: [...],
  limit: 50,
  sort: [
    { column: 'order_date', direction: 'desc' },
    { column: 'order_id', direction: 'asc' },
  ],
  // …
});
```

`values` is one value per `sort` entry, in `sort` order — the sort-key tuple of
the **last row of the previous page**. `uniqueColumn` names the column that makes
the sort a total order.

### The builder rejects a cursor it cannot resume correctly

A keyset cursor is only well-defined over a total order: without one, rows that
tie on every sort column have no defined position relative to the cursor, and a
page boundary landing inside a tie group silently drops or repeats rows. Nothing
in the descriptor tells the builder which column is unique, so the caller
declares it and the builder checks the three things it can:

- `sort` is non-empty,
- `values.length` equals `sort.length`,
- the **last** `sort` entry is `uniqueColumn`,
- the cursor value for `uniqueColumn` is not null.

Each failure throws at construction time. This is the same posture as
`buildUpdateQuery`/`buildDeleteQuery` refusing an unfiltered mutation: a query
that cannot be correct is not built. What the builder cannot check — that
`uniqueColumn` really is unique — is the caller's to get right, exactly as
`allowedColumns` membership is.

The non-null rule is not a formality. Postgres permits **many** NULLs in a unique
index, so a null in that position is not a total order at all. It also happens to
be what keeps the predicate's final OR-branch alive, and therefore what
guarantees every bound cursor value is referenced by the emitted SQL — pg rejects
a bind list longer than the statement's placeholder count.

### The predicate is a NULL-aware lexicographic comparison, not a row comparison

The compact spelling of a seek predicate is a row-value comparison,
`("order_date", "order_id") > ($1, $2)`. It is not usable here, for two
independent reasons:

- **It cannot express mixed directions.** `appendPrimaryKeySorting` appends the
  primary key **ascending**, so any user sort that is `desc` produces
  `[{col, desc}, {order_id, asc}]` — the common case, not an edge case.
- **It is wrong across NULLs.** `"delivery_date" > $1` is NULL, not true, for a
  row whose `delivery_date` is NULL, so a scroll sorted on any nullable column
  would silently stop at the first NULL row. Nine of `enterprise_orders`' columns
  are nullable, several of them sortable in the UI.

So the builder emits the expanded lexicographic form — one OR-branch per sort
position, each branch pinning the earlier columns to equality and advancing the
one at its own position:

```sql
(   ("order_date" < $1)
 OR ("order_date" IS NOT DISTINCT FROM $1 AND "order_id" > $2))
```

`IS NOT DISTINCT FROM` is the equality half, so a NULL cursor value ties with a
NULL column value instead of poisoning the branch. The "advance" half follows
Postgres's default null placement (`ASC` ⇒ NULLS LAST, `DESC` ⇒ NULLS FIRST):

| direction | cursor value | rows strictly after it    |
| --------- | ------------ | ------------------------- |
| `asc`     | not null     | `col > $n OR col IS NULL` |
| `asc`     | null         | none — branch omitted     |
| `desc`    | not null     | `col < $n`                |
| `desc`    | null         | `col IS NOT NULL`         |

A branch that can match nothing (the `asc` + null row of the table) is omitted
rather than emitted as a false constant. The final branch is never one of them,
because `uniqueColumn` carries a non-null value by the rule above.

## Consequences

- **Additive public surface on `@lcabrera/server`**: `QueryCursor` and
  `SelectQueryDescriptor.cursor`. An api-surface event → snapshot regen +
  changeset. No existing caller changes.
- **Correctness is delegated, and stated.** The builder enforces the shape of a
  total order and trusts the caller for the uniqueness of `uniqueColumn` — the
  same division of labour as `allowedColumns`.
- **Index shape matters.** The lexicographic form lets Postgres seek on the
  leading sort column; a composite index matching the full `ORDER BY` is what
  makes the deep pages actually O(limit). Without one the win is smaller than the
  form suggests.
- **`OFFSET` is not deprecated.** Jump-to-page reads keep it, and a caller that
  passes neither `cursor` nor `offset` is unaffected.
- **A cursor and an `offset` together are accepted** and mean what they say —
  skip `n` rows _after_ the cursor. Callers should pass one or the other.

## References

- [ADR-008 — primary-key sort tiebreaker](../../apps/react-router/docs/decisions/ADR-008-primary-key-sort-tiebreaker.md)
- [ADR-051 — `withTransaction` + the `tx` executor option](./ADR-051-with-transaction-and-tx-executor-option.md)
- Issues #403 (this ADR), #404 (the builder), #391 (the epic)
