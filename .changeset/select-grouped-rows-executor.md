---
'@lcabrera/server': minor
---

`@lcabrera/server` gains `selectGroupedRows`
(`@lcabrera/server/db/select-grouped-rows.util`) — the analytical sibling of
`selectRows`, and the one place the grouped-read halves meet a connection.

It resolves what each group key and aggregate column may do
(`getColumnGroupingCapabilities`, one catalogue round trip), builds the
`GROUP BY GROUPING SETS` query from that answer (`buildGroupQuery`), and runs it.

Composing it this way is what keeps ADR-058's gates enforceable. `buildGroupQuery`
is pure and takes the capability map as data, so a caller wiring the two halves
together itself is one hand-written map away from authorizing a group key the
catalogue refused. There is now a single entry point that cannot be handed one.

The result carries `aggregates`, `keys`, `groupingSetMasks` and `maskAlias`
beside the rows, because a grouped row cannot be decoded without them: an
aggregate's alias is derived from its function and column, and the `GROUPING()`
mask's bit positions are relative to the key order.

`tx` threads through **both** round trips, so a caller that needs the capability
answer and the query it authorizes to see one snapshot passes a transaction and
gets it. Omitted, each runs on the pool — correct for a read, and no connection is
held for a caller that will not reuse it.

Additive only — no existing export changes.
