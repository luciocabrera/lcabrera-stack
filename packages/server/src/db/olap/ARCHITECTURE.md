# OLAP Seam Architecture

The half of the OLAP feature that is neither the query builder nor the grid: the
translation from a **group row** back into a read, and the decode of what a
grouped read projects. Pure, DB-free, and a sibling of `group-query-builder/` in
the same way `query-builder/` is.

## Why it lives here

Grouping, rollup, cube and drill are features of a table, in the same sense that
sorting and filtering are — so their machinery belongs to the packages, not to
whichever app first needed it
([ADR-082](../../../../../docs/decisions/ADR-082-the-olap-seam-lives-in-the-packages.md)).
Every file here was previously a `toOrder*` module in `apps/react-router`, and
none of them referenced an order: what looked like route code was the protocol.

The split against `group-query-builder/` is **write versus read of the same
protocol**. That directory builds the `GROUPING SETS` query and projects the
`GROUPING()` mask; this one decodes that mask and turns the resulting group row
back into a query. Keeping the encoder and the decoder in one package is the
point — they are a matched pair, and only the decoder having lived in an app made
them look separable.

## Files

| File                     | Role                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `to-drill-read.util.ts`  | **Entry point.** A group row → the paginated read of the rows underneath it, or a typed refusal       |
| `to-group-row.util.ts`   | **Entry point.** One row of a grouped read → the group summary a grid renders, decoding the mask      |
| `to-group-label.util.ts` | One group key value → its display string. Composed by `to-group-row`; the closed dimension vocabulary |
| `olap.types.ts`          | `OlapDrillRead`, `OlapDrillRefusal`, `OlapDrillTranslation`                                           |

## The mask is the only thing that separates a subtotal from a NULL

A row whose `shipping_country` is NULL is either a real NULL in the data or the
subtotal across every country, and the two are **textually identical**. Only
`GROUPING()` tells them apart, so `to-group-row` reads it before anything else. A
set bit means "this row is not keyed by that column", never "no value here".

Two things fall out of that decode and cannot be derived downstream:

- **`path` holds only the keys the row is actually grouped by.** A rollup emits
  sets that are prefixes of the key list, so dropping the rolled-up keys leaves a
  prefix whose length is the row's depth — which is what the grid reads a group's
  level from ([ADR-080](../../../../../docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)).
- **`isSubtotal`** — whether anything was rolled up at all. A flat read never
  sets a bit, so this stays `false` throughout and the behaviour is byte for byte
  what it was before rollup existed.

## A key crosses twice; an aggregate once

`to-group-row` emits every group key **formatted and raw**. Only this side can
format one — nothing downstream resolves a path entry back to the column it came
from — but formatting is lossy in exactly the direction a query needs: a NULL key
becomes `(empty)`, a date an ISO string. The raw value is what a drill turns into
a filter, so collapsing the two loses one of the two questions being answered.

An aggregate is the opposite and carries only the raw value: it names its column,
so the cell rendering it can ask for that column's own `dataType` and `format`.
Formatting one here is how a `numeric` sum once reached a currency column as
`"302540833.38"` — `pg` returns `numeric` and `bigint` as strings, and this side
has nothing better to do with one than pass it along.

## Drill correctness is four rules, and three of them fail quietly

`to-drill-read` exists because none of these is obvious, and a client
reimplementation would be a second place for them to drift:

1. **The grouped view's filters are inherited unchanged, and first.** Dropping
   them returns rows that are true facts about the table and wrong under the
   heading they appear beneath — a group stating 214 orders with 1,008 rows under
   it. Both render and neither throws.
2. **A NULL key becomes `IS NULL`, never an equality.** SQL equality against NULL
   is never true, so the equality spelling returns an empty page — on the group a
   reader is most likely to be puzzled by and click.
3. **Group-key terms come out of the sort, and the primary key goes in.** The
   keys are constant within a group and order nothing; without a total order two
   equal rows can come back in any order, repeating and skipping rows across
   pages ([ADR-008](../../../../../apps/react-router/docs/decisions/ADR-008-primary-key-sort-tiebreaker.md)).
4. **The read carries no grouping.** Forwarding the view's grouping sends it back
   into the grouped branch and returns group rows again — the one mistake that
   looks like it works, because it returns rows.

The primary key and the page ceiling are **arguments**, not constants: only the
route knows them. That is the whole of what a caller has to supply, and it is why
the app's remaining `toOrderDrillRead` is six lines.

## A refusal is a value, not an exception

A grand total, a subtotal and an incomplete path each get their own reason,
because they call for different UI: the first two should never offer the
affordance at all, where an incomplete path means the request and the row
disagree and is a bug rather than a state. Callers answer `400` to all three —
never an empty page, which would present a caller bug as a group that happens to
hold no rows ([ADR-079](../../../../../docs/decisions/ADR-079-drilling-from-a-group-to-its-rows.md)).

Grand total is tested **before** subtotal: it is also `isSubtotal`, so the other
ordering reports the less specific reason for every grand total.

## What this does NOT do

- **No SQL.** It produces descriptors; `select-rows`/`select-grouped-rows`
  execute them.
- **No transport.** The wire codec for a drill request is `@lcabrera/api`'s
  `olap/`, which both this package and the browser depend on.
- **No rendering.** The grid owns which affordance a group row offers.
