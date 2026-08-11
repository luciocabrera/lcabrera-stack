# The grid focus model — `role="grid"`, roving tabindex, data-derived row identity

**Status:** Proposed

<!-- Draft — no number until adoption (see README.md). Home at adoption:
     docs/decisions/. The code is entirely in packages/ui; ADR-011 sits in the app
     home only because it predates the Table's extraction into the package. -->

## Context

ADR-011 called the grid focus model _"Step 0 … the spine that row selection,
grouping, and nested headers all ride on"_ and deferred it. It has not been built.

What the Table has today:

- The only `role=` anywhere in it is `role='separator'`, on the column resize
  handle. There is no `role="grid"`, `row`, `gridcell` or `columnheader`.
- The only `tabIndex={0}` is on that same resize handle.
- No `aria-sort` on any header, despite sorting being a shipped feature.
- The only keyboard handling is arrow-key column resizing.
- Body rows are keyed by their **array index**.

And a compounding fact that is easy to miss: the Table's styling sets `<tbody>` to
`display: grid`, `<tr>` to `display: flex` and cells to `display: flex`. Those
overrides **strip native table semantics** in every major browser — so the grid is
not merely under-annotated, it is currently exposed to assistive technology as
generic containers rather than a table at all.

Rows are virtualized: only a window is rendered, with spacer rows above and below
sized so that `offsetY + renderedRows × rowHeight + bottomSpacer === totalHeight`.

## Problem

Three distinct problems share one solution and must be decided together.

**Semantics.** A data grid that reports as generic containers is unusable with a
screen reader, and no amount of grouping, selection or nested-header work improves
that — each of them makes it worse, by adding structure nothing can perceive.

**Identity.** `key={rowIndex}` means React recycles a DOM node across different
data whenever rows reorder. Stable focus, selection and group rows are all
impossible on top of it. The existing primary-key helper `resolveCrudRowId`
**throws** on a missing or non-scalar key — correct for a CRUD link, wrong for a
render-path key, where it would turn a data quirk into a blank table.

**Focus under virtualization — the part that is easy to miss.** A focused row that
scrolls out of the window is **unmounted**. DOM focus falls to `<body>`, and
arrow-key navigation dies with no error and no visible cause. Nothing in the tree
handles this, and it is the hardest step in the work.

## Options considered

1. **Remove the `display` overrides and rely on native table semantics.**
   Rejected: the overrides are what make the virtualized layout and column pinning
   work; `TableRow/ARCHITECTURE.md` records why. Reverting them trades an a11y bug
   for a layout regression.
2. **Annotate roles only, leave focus for later.** Rejected: `role="grid"` without
   a focus model is a _worse_ lie than no role — it promises keyboard interaction
   that does not exist.
3. **Full focus model: roles + roving tabindex + virtualization-aware counting +
   data-derived identity. `Chosen.`**
4. **Ship it as part of grouping.** Rejected — see Consequences.

## Decision

The grid declares explicit ARIA roles (`grid`, `row`, `gridcell`,
`columnheader`), because the `display` overrides make implicit semantics
unavailable. `aria-sort` is set on sortable headers.

**Exactly one element in the grid carries `tabIndex={0}` at any time** (roving
tabindex); every other focusable cell carries `tabIndex={-1}`. Arrow keys, Home,
End, PageUp and PageDown move the roving focus.

**Focus is held as data in the store, not as DOM state**, and re-applied to the
rendered node. A focus move that leaves the virtualization window scrolls the
target into view first. This is what makes focus survive unmounting.

**Row counts are virtualization-aware.** `aria-rowcount` reports the full row
count and `aria-rowindex` the row's absolute position — not its position in the
rendered window. Spacer rows are hidden from the accessibility tree.

**Row identity is data-derived**, from the primary-key columns, and the resolver
**does not throw**: an unresolvable key falls back to a prefixed index-derived
key, so the degraded path is never worse than today's behaviour. Value-derived and
index-derived keys are prefixed distinctly so they can never collide — a row whose
primary key is literally `"3"` and the row at index 3 must remain distinguishable.

**This ships alone, before and independent of grouping.**

## Consequences

**What this buys, on its own.** The grid becomes keyboard-navigable and
screen-reader-correct for the first time. That is a shippable user-facing
improvement with no dependency on grouping, which is precisely why it ships
separately: grouping never blocks on relitigating it, and it never has to be
justified by a feature it merely enables.

**What this costs.** It touches every row and cell component in the Table — the
largest single change in the grouping programme, for a feature that is not
grouping. Splitting it in two is how that is made tractable: **row identity alone**
is small, lands first, and unblocks the early grouping slices; **roles and focus**
is the large half and blocks only the tree-semantics work.

**The residual risk is focus recovery**, and it does not fully go away. Every later
feature that removes rows from the rendered set — collapsing a group, filtering,
deleting — can remove the focused row, and each must decide where focus goes.
Grouping's collapse is the first such case and moves focus to the ancestor; that
rule has to be restated per feature rather than inherited for free.

`role="grid"` also commits the Table to grid keyboard conventions permanently.
Diverging from them later (for a custom interaction) becomes a documented
exception rather than a free choice.

## Alternatives considered

**Rejected: reusing `resolveCrudRowId` for row keys.** It throws on a missing or
non-scalar primary key. That is right for a CRUD link — a bad id must not reach a
route — and wrong on the render path, where a key is needed on every render and a
throw means an empty table instead of a slightly-degraded one.

**Rejected: deriving `aria-rowindex` from the rendered window.** It is the cheaper
implementation and it is wrong: a screen reader would announce "row 3 of 50" for a
row that is row 4,312 of 500,000.

## References

- [ADR-011](../../../../apps/react-router/docs/decisions/ADR-011-grid-interaction-architecture.md) — deferred this as "Step 0"
- `docs/agents/planning/table-row-grouping-plan.md` §1.6, §6 Slice 0, Risk 1
- `packages/ui/src/components/Table/TableRow/ARCHITECTURE.md` — the height invariant and why the `display` overrides exist
- Backlog entries P-05 (this ADR), P-10 (row identity), P-11 (roles and focus), P-21 (tree semantics)
