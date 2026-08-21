# ADR-062 — Declare grid semantics explicitly and rove focus over data-derived rows

- **Status:** Accepted
- **Date:** 2026-08-12
- **Scope:** `@lcabrera/ui` — `src/components/Table/` (body, rows, cells, header cells) and the virtualization window they render through
- **Issue:** #554 — implemented by #559 (row identity) and #560 (roles and focus)
- **Related:** [ADR-011](../../apps/react-router/docs/decisions/ADR-011-grid-interaction-architecture.md) (deferred this as "Step 0"), [ADR-012](../../apps/react-router/docs/decisions/ADR-012-column-width.md) (the first instance of ADR-011's model), [ADR-052](./ADR-052-keyset-pagination-for-infinite-scroll.md) (where a page of rows comes from)

## Context

[ADR-011](../../apps/react-router/docs/decisions/ADR-011-grid-interaction-architecture.md)
put accessibility in both of its layers — the command owns the semantic contract,
the surface owns "ARIA mechanics (role, focus)" — and called the focus model
_"Step 0 … the spine that row selection, grouping, and nested headers all ride
on"_. It deferred building it. It is still not built.

What the Table has today, read from the source:

- The only `role` attribute anywhere in it is `role='separator'`, on the column
  resize splitter
  ([`ResizeHandle.component.tsx`](../../packages/ui/src/components/Table/TableHeaderCell/ResizeHandle/ResizeHandle.component.tsx)).
  There is no `grid`, `row`, `gridcell` or `columnheader`.
- The only `tabIndex={0}` is on that same splitter, so it is the grid's only tab
  stop.
- No `aria-sort` on any header, although sorting ships —
  [`TableHeaderCell.component.tsx`](../../packages/ui/src/components/Table/TableHeaderCell/TableHeaderCell.component.tsx)
  reads `column.sortDirection` and renders an indicator from it.
- The only keyboard handling in the Table is the splitter's own
  ([`useColumnResize.hook.ts`](../../packages/ui/src/components/Table/hooks/useColumnResize.hook.ts)
  → `resolveKeyboardResizeAction.util.ts`, which answers to arrows, `Home`, `End`
  and `Enter`). Nothing moves between rows or cells.
- Body rows are keyed by their array index —
  [`TableBodyRows.component.tsx`](../../packages/ui/src/components/Table/TableBodyRows/TableBodyRows.component.tsx)
  renders `<TableRow key={rowIndex}>` where `rowIndex = startIndex + index`.

And a compounding fact that is easy to miss. The Table's styling takes every
structural element out of the table formatting context:
[`TableBody.stylex.ts`](../../packages/ui/src/components/Table/TableBody/TableBody.stylex.ts)
sets the populated `<tbody>` to `display: grid`,
[`TableRow.stylex.ts`](../../packages/ui/src/components/Table/TableRow/TableRow.stylex.ts)
sets every `<tr>` to `display: flex`, and
[`TableBodyCell.stylex.ts`](../../packages/ui/src/components/Table/TableBodyCell/TableBodyCell.stylex.ts)
sets every body cell to `display: flex`. Browsers drop an element's implicit
table/row/cell role along with its table `display`, so the grid is not merely
under-annotated — it is exposed to assistive technology as generic containers.
The DOM still reads as a table; the accessibility tree is where this is visible,
so the probe is an a11y-tree inspection, not a snapshot of the markup. (Only the
populated body is affected: the empty state keeps `display: table-row-group`.)

Rows are virtualized.
[`TableBody.component.tsx`](../../packages/ui/src/components/Table/TableBody/TableBody.component.tsx)
gives `<tbody>` a computed `totalHeight` for the whole dataset and renders only
the `startIndex`–`endIndex` window between two `SpacerRow`s, which already carry
`aria-hidden='true'`. The window arithmetic
(`offsetY + visibleRows × rowHeight + bottomSpacerHeight === totalHeight`) is
recorded in
[`TableRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableRow/ARCHITECTURE.md),
which also notes that it holds _because_ `<tbody>` is `display: grid`.

One distinction in the data store turns out to be load-bearing. `DataState`
([`fetchMoreData.types.ts`](../../packages/ui/src/components/Table/contexts/TableData/data/actions/fetchMoreData.types.ts))
carries `totalLoadedRows` and `totalRows` as separate fields, plus `hasMore`;
[`getInitialDataState.util.ts`](../../packages/ui/src/components/Table/contexts/TableData/utils/getInitialDataState.util.ts)
defaults `totalRows` to `0` and derives `hasMore` as `totalRows > totalLoadedRows`.
Virtualization windows over `totalLoadedRows` — what has been fetched — while
`totalRows` is the dataset the user is actually navigating.

## Problem

Three problems share one solution and have to be decided together.

**Semantics.** A data grid that reports as generic containers is unusable with a
screen reader, and no amount of grouping, selection or nested-header work
improves that — each of them makes it worse, by adding structure nothing can
perceive.

**Identity.** `key={rowIndex}` means React recycles a DOM node across different
data whenever rows reorder, filter or shift. Stable focus, selection and group
rows are all impossible on top of it. The obvious donor is the existing
primary-key helper
[`resolveCrudRowId`](../../packages/ui/src/components/Table/utils/resolveCrudRowId.util.ts),
but it **throws** — `TypeError` when no column is marked `isPrimaryKey`, and
again when a primary-key value is neither string nor number. That is right for a
CRUD link and wrong for a render-path key.

**Focus under virtualization — the part that is easy to miss.** A focused row
that scrolls out of the window is _unmounted_. DOM focus falls to `<body>`, the
tab order restarts from the top of the document, and arrow-key navigation dies
with no error and no visible cause. Nothing in the tree handles this today
because nothing in the tree has focus to lose.

## Options considered

1. **Remove the `display` overrides and rely on native table semantics.**
   Rejected: the virtualization arithmetic depends on `<tbody>` being
   `display: grid` — `TableRow/ARCHITECTURE.md` records that a row painting at
   any other height desynchronizes the body from its contents, the leftover space
   being redistributed across grid tracks as visible layout shift. Reverting
   trades an accessibility bug for a layout regression.
2. **Annotate roles only, leave focus for later.** Rejected: `role="grid"`
   without a focus model is a _worse_ lie than no role — it promises keyboard
   interaction that does not exist.
3. **Roles + roving tabindex + virtualization-aware counting + data-derived
   identity. `Chosen.`**
4. **Ship it as part of grouping.** Rejected — see Consequences.

## Decision

**Roles are declared explicitly**, not inherited. The grid carries `role="grid"`,
rows `role="row"`, body cells `role="gridcell"` and header cells
`role="columnheader"`, with `aria-sort` on every sortable header. This is not
belt-and-braces over native semantics; it is the only source of those semantics,
because the `display` overrides removed the implicit ones.

**Exactly one element in the grid carries `tabIndex={0}` at any time**, and every
other focusable descendant carries `tabIndex={-1}`. Arrow keys, `Home`, `End`,
`PageUp` and `PageDown` move that single tab stop. The grid is therefore one stop
in the page's tab order, entered where it was left rather than at its first cell.

**Focus is held as data in the store — a row key plus a column key — and applied
to the DOM node that currently represents it**, never read back from
`document.activeElement` as the source of truth. This is what lets focus outlive
the unmounting of the node holding it, and it follows the store pattern the rest
of the Table already uses.

**Row counts are virtualization-aware**, which is what makes `role="grid"`
truthful here at all. Without them a screen reader perceives only the rendered
window and announces it as the whole dataset.

- `aria-rowcount` on the grid reports the full dataset **plus the header row** —
  `totalRows + 1`, never `totalLoadedRows`, which would shrink and grow as pages
  arrive and describe the fetch rather than the data. The `+ 1` is not incidental:
  the count and the indices below must share one base, and the header occupies
  index 1. When no total is known (the consumer supplied none, so `totalRows` sits
  at its `0` default), `aria-rowcount` is `-1`, the value ARIA reserves for an
  unknown total — not `0 + 1`, which would assert a grid holding nothing but its
  header.
- `aria-rowindex` on each row is its absolute position in that dataset, not its
  offset in the rendered window.
- Indices are 1-based and continuous across the whole sequence, and the header row
  participates in it as row 1 — so a body row at loaded index `i` carries `i + 2`.
  The invariant worth checking is that the largest index the grid can emit equals
  the count it advertises: the last body row is `totalRows + 1`, which is exactly
  the `aria-rowcount` above. If the two are computed from different bases, one of
  them is wrong — and that is the check to write as a test, because reading either
  rule alone will not catch it.
- Spacer rows stay `aria-hidden='true'` (they already are), so the filler that
  makes the scroll height work is never announced as a row.

**Row identity is data-derived, and the resolver is total — it never throws.** A
row's key comes from its primary-key column(s), the same source `resolveCrudRowId`
draws on. When a key cannot be derived — no primary-key column, or a value that
is not a scalar — the resolver falls back to an index-derived key instead of
raising. A key is needed for every row on every render, so a throw on the render
path takes the whole table to an error boundary: strictly worse than today, where
an index key at least renders. A grid that cannot identify a row should degrade to
the behaviour it already had, not disappear. Value-derived and index-derived keys
are prefixed distinctly so they can never collide — a row whose primary key is
literally `"3"` and the row sitting at index 3 must remain distinguishable.

**Focus recovery has two cases, and they resolve differently.**

- **The row still exists in the data but is outside the rendered window** — the
  ordinary consequence of scrolling. The stored focus is kept as-is; the grid
  container holds the `tabIndex={0}` while no rendered row does, so the grid
  remains a tab stop. Re-entering it, or pressing a navigation key, scrolls the
  stored row into view and re-applies focus to the node once it mounts. A
  keyboard move whose target lies outside the window scrolls it in first and
  focuses after, in that order.
- **The row no longer exists in the data** — filtered out, deleted, or hidden
  under a collapsed ancestor. Its identity is now unresolvable, so it cannot be
  restored. Focus moves to the nearest surviving row at the same absolute index,
  clamped to the bounds of the data; if no rows survive, it falls to the grid
  container, which is why the container is always focusable. Focus never falls to
  `<body>`.

**This ships alone, before and independently of grouping.**

## Consequences

**What this buys, on its own.** The grid becomes keyboard-navigable and
screen-reader-correct for the first time. That is a shippable, user-facing
improvement with no dependency on grouping — which is precisely why it ships
separately: grouping never has to relitigate it, and it never has to be justified
by a feature it merely enables.

**What this costs.** It touches every row and cell component in the Table, for a
feature that is not grouping. Splitting it in two is how that is made tractable:
**row identity alone** (#559) is small, lands first, and unblocks the early
grouping slices; **roles and focus** (#560) is the large half and blocks only the
tree-semantics work.

**Stable identity is a guarantee only where a primary key exists.** The
index-derived fallback is exactly as unstable as today's key, so a consumer whose
columns declare no primary key gets correct roles and counting but not focus that
survives a reorder. That is a deliberate floor, not an oversight — but it means
"focus is stable" is a claim about configured tables, and the fallback path
should be visible to a consumer rather than silent.

**The residual risk is focus recovery, and it does not fully go away.** The rule
above settles where focus goes when a row vanishes generically. Every later
feature that removes rows from the rendered set still has to decide whether the
generic answer is the right one for it — grouping's collapse is the first such
case, and moves focus to the ancestor rather than to the nearest surviving index.
That has to be restated per feature rather than inherited for free.

**`role="grid"` commits the Table to grid keyboard conventions permanently.**
Diverging from them later, for a custom interaction, becomes a documented
exception rather than a free choice. `aria-rowcount` also becomes a contract on
the consumer-supplied total: a consumer that reports a wrong `totalRows` now
produces a wrong announcement, where before it only affected `hasMore`.

**The `display` overrides are now load-bearing in both directions.** They were
already required by the virtualization arithmetic; from here they are also the
reason the explicit roles exist. Anyone who later restores native table `display`
values must remove the roles in the same change, or the grid ends up with
duplicated semantics.

## Alternatives considered

**Rejected: reusing `resolveCrudRowId` for row keys.** It throws on a missing or
non-scalar primary key. That is correct for a CRUD link — a bad id must not reach
a route — and wrong on the render path, where the same throw empties the table.
The two callers want opposite failure modes from the same derivation, so the
derivation is shared and the failure handling is not.

> **Note, 2026-08-21 (#887):** the reasoning above was right and was applied to
> only one of the two render-path callers. `TableRowActionsMenu` kept the
> throwing call, and a group row misclassified as a data row duly emptied the
> table. `resolveCrudRowId` no longer throws — it answers `undefined` and the
> menu renders nothing — so the throwing form this paragraph rejects no longer
> exists anywhere. Nothing wanted it: after the fix it had no callers at all.
> The decision stands; what changed is that "the failure handling is not
> shared" now covers every caller rather than one.

**Rejected: deriving `aria-rowindex` from the rendered window.** It is the
cheaper implementation and it is wrong: a screen reader would announce "row 3 of
50" for a row far down a large dataset. The window index is an implementation
detail of scrolling and has no meaning to a user.

**Rejected: `aria-rowcount` from `totalLoadedRows`.** It is always defined, which
is its only appeal. It would announce a total that grows every time a page loads,
describing the fetch rather than the data — and under infinite scroll the number
is wrong for as long as anything remains unfetched.

**Rejected: restoring focus by re-querying the DOM after a scroll.** Focus would
depend on render timing, and the failure mode is silent — focus lands on whatever
occupies that position after the window moves, which is a different row. Holding
focus as data and re-applying it makes the identity explicit and testable without
a real scroll container.

## References

- [ADR-011](../../apps/react-router/docs/decisions/ADR-011-grid-interaction-architecture.md) — deferred this as "Step 0", and assigned ARIA role/focus mechanics to the surface layer
- [`docs/agents/planning/table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md) — the design session this decision was extracted from
- [`packages/ui/src/components/Table/TableRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableRow/ARCHITECTURE.md) — the height invariant, and why `<tbody>` is `display: grid`
- [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) — how a grouped grid renders hierarchy, decided so that a group row owns addressable cells and the roving tab stop above needs no special case for it
- Issues #554 (this decision), #559 (data-derived row identity), #560 (roles and focus), #547 (parent)
