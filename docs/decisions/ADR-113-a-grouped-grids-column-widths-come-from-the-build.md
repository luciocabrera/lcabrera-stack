---
governs:
  - ui
---

# ADR-113 — A grouped grid's column widths come from the build, not from the declared column

**Status:** Accepted

**Corrects:** [ADR-105](./ADR-105-a-measure-is-a-column-of-its-own.md), whose measure-width paragraph this replaces.

## Context

A column declares `minWidth`/`maxWidth` for the field it shows.
[ADR-105](./ADR-105-a-measure-is-a-column-of-its-own.md) then floored a derived
measure at `DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH` (200), because a measure holds the
widest value the column ever produces and a share of the grand total puts a bar and
a percentage beside it — while promising that "the floor never crosses a `maxWidth`
the consumer declared".

Those two rules meet badly on any column narrower than the floor, and most are.
`Total Amount` is declared `130–180`; its `Sum` column is floored to 200, clamped
back to the source's 180, and inherits that same 180 as its maximum. The band
collapses: `minWidth === maxWidth`, so `resolveColumnWidthBounds` hands the splitter
a range of zero and every drag, keystroke and preset moves the column by nothing.
The handle renders, responds to the pointer, and does not resize — an affordance
that looks live and is not, which is the failure [ADR-112](./ADR-112-a-grouped-grid-drops-the-row-actions-column.md)
removes a column for.

The declared widths were never sized for this view in the first place. A grouped
grid paints group keys and measures — a value the consumer's own column never held.

## Decision

**While a grouping is applied, every painted column takes one width band, and the
band comes from the build.** `withGroupedColumnWidths` runs in
`getPinnedDerivedColumnsState`, after the scope and the aggregate ordering and
before the layout, and replaces `minWidth`/`maxWidth` on each column it is handed.
The declared widths are not consulted, not clamped against, and not lost: the step
is a derivation, so ungrouping restores them.

**The band is `import.meta.env`, read through
`resolveGroupedColumnWidthBand`:** `VITE_TABLE_AGGREGATE_MIN_WIDTH` and
`VITE_TABLE_AGGREGATE_MAX_WIDTH`, falling back to
`DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH` (200) and `DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH`
(600, the table-wide ceiling). A value that is not a positive number takes the
fallback, and an inverted band resolves to its own floor rather than to a range the
splitter could not move within.

**`resolveAggregateColumnMinWidth` is deleted, and `withAggregateColumns` states no
width at all.** A derived measure carries no `minWidth`/`maxWidth` of its own —
there is exactly one place a grouped column's width is decided.

## Consequences

**A consumer's declared `maxWidth` stops being a ceiling while grouping is on.** A
column declared `130–180` is dragged between 200 and 600 the moment it is grouped.
That is the point — those numbers describe the ungrouped field — but it does mean a
narrow column is no longer narrow in this view, and a build that wants it back sets
the two variables.

**The knob is the consuming build's, not the consumer's code.** `import.meta.env` is
replaced at build time by the app's own Vite instance, the way `VITE_LOG_LEVEL`
already is in this package, so there is no new prop on the public Table surface and
no per-table override. A consumer needing per-table bands would need a real prop;
nothing asks for that yet.

**The group-key columns move too.** The decision was taken for the measures, and the
band applies to every column a grouped grid paints, so `Category` is sized like
`Sum`. One rule for the view beats two rules meeting at an edge — which is the bug
above — but a group key holding a short label now starts wider than it needs to.

## Alternatives considered

1. **Give the measure the slack the source had** — `max = min + (sourceMax −
sourceMin)`. Rejected: it keeps a promise the declared numbers cannot make. A
   column declared `100–110` would yield a 10px band, so the same collapse returns
   in a milder form, and the width of one column would depend on an unrelated
   number the author chose for a different view.
2. **Widen the ceiling to `DEFAULT_MAX_COLUMN_WIDTH` only when the source's is below
   the floor.** Rejected: two rules again, one of which fires only on narrow
   columns — the reader cannot predict which they are looking at.
3. **A prop on the Table.** Rejected for now: this is deployment shape, not a
   per-table decision, and every consumer would pass the same value from their own
   config. A prop can be added later without moving the default.

## References

- [ADR-105](./ADR-105-a-measure-is-a-column-of-its-own.md) — the floor this replaces
- [ADR-112](./ADR-112-a-grouped-grid-drops-the-row-actions-column.md) — the other grouped-grid affordance corrected here
- [#1113](https://github.com/luciocabrera/lcabrera-stack/issues/1113)
