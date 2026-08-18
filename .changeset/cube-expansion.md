---
'@lcabrera/server': minor
---

Grouped reads can now be a **cube**, alongside `flat` and `rollup`.

`GroupingMode` gains `'cube'`, which emits every subset of the group keys as an
explicit grouping set — the same construct the other two modes already compile
to (ADR-059), so nothing about decoding a grouped row changes. The mask still
tells a structural NULL from a real one, and `groupingSetMasks` still ships in
emission order.

```ts
await selectGroupedRows({
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: ['region', 'channel', 'amount'],
  grouping: 'cube',
  keys: ['region', 'channel'],
  maxRows: 5000,
  schema: 'public',
  table: 'orders',
});
// grouping sets: (region, channel), (region), (channel), ()
```

**A cube result is a lattice, not a tree.** `(channel)` with no region is a
child of no region row and has no depth, so a consumer that indents grouped rows
by path length is correct for `flat` and `rollup` and wrong here — render a cube
flat, with each row carrying its own coordinates. The rows stay long, one per
grouping-set combination, so a pivot projection remains possible later.

**A cube is capped at three group keys**, one below the four the other modes
allow, and is refused at construction with the existing `'too-many-keys'`
reason. Its set count is `2ⁿ` rather than `n+1`, and the cardinality estimate
cannot be relied on to catch that: the estimate is `unknown` whenever a key has
no statistics, and unknown warns rather than refuses, so on an unanalysed table
there would be no bound at all.

**The depth-refusal message now names the mode** — `A cube grouping takes at
most 3 group keys; got 4.` where it previously read `A grouped query takes at
most 4 group keys; got 5.`. Anything matching on that message text needs
updating; the `reason` discriminant is unchanged and is what callers should
branch on.
