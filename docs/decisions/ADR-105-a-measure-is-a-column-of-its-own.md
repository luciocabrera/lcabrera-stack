---
governs:
  - ui
---

# ADR-105 — A measure is a column of its own: pinnable with its band, aggregable from its own menu, and wide enough for its share

**Status:** Accepted

**Issue:** [#1054](https://github.com/luciocabrera/lcabrera-stack/issues/1054)

**Amends**
[ADR-100](./ADR-100-the-header-menu-refuses-the-layout-actions-a-grouped-column-cannot-take.md)
— which disabled the three pinning items under both layout locks. The
`'group-key'` half stands; the `'measure'` half is reversed here.

## Context

ADR-100 treated the two layout locks alike for pinning. They are not alike. A
group key's pin is **undone** on the next derivation, so the click reports a
success that never happens. A measure's pin is **widened**: it resolves through
`toDeclaredColumnKey` to the column it measures, and `withAggregateColumns`
expands that back into every measure of that column, so pinning `Sum` pins
`Minimum` and `Maximum` with it. That is more than was asked for, and it is also
the only arrangement `resolveHeaderBands` can draw — a band spans adjacent
columns, so a half-pinned band loses the heading that names what its numbers
measure. Refusing the action left a grouped reader no way to keep a subtotal
in view while scrolling a wide grid.

The per-column settings drawer never asked the lock at all. Its Pinning tab
offered a group key both sides and a Clear Pinning that appeared to undo the
hoist, and its write path — `resolveBatchColumnSettingsUpdate`, separate from
`useSetColumnPinning` — wrote a measure's token straight into `columnPinning`,
which is the declared-only invariant ADR-100's Context describes.

**The aggregate functions were offered in exactly the state where they do
nothing, and withheld in the state where they act.** On a flat grid,
`AggregateActions` listed every function the catalogue reports for the column,
and applying one has no group row to state a value in. Once grouped, the grid
paints group keys and measures alone (ADR-096), so the column that carries the
capability is no longer on screen — and the measure standing in its place asks
the capability map with the aggregate token, which is keyed by declared column
name and answers `undefined`. The list was unreachable from the moment it became
useful.

## Decision

**The lock decides which refusal, not whether to refuse.** Pin Left, Pin Right
and Clear Pinning are disabled under `'group-key'` alone. Under `'measure'` they
are enabled and carry a `title` from the new `resolveColumnPinningTitle`, which
turns the lock into the sentence the item states: the refusal on a group key,
the band it applies to on a measure. That second sentence names no verb —
"Applies to the whole band", not "Pins with its band" — because the same string
lands on Clear Pinning, which unpins. Hide Column is unchanged — refused on a
group key, and taking the band with it on a measure.

**The drawer asks the same hook and maps the same half.** `PinningSection`
reads `useTableColumnLayoutLock` and hands the lock to both toggles and to
`PinningSectionToolbar`, which disables its Clear Pinning on a group key and
carries the same `title` — the toolbar derives both answers from the lock rather
than being told them separately, so the button and the sentence cannot disagree. `resolveBatchColumnSettingsUpdate` resolves the **pinning** key
through `toDeclaredColumnKey`, and so do the draft the drawer opens with and its
Reset. Sorting, sizing and filtering stay on the token, because those act on the
measure column itself.

**`AggregateActions` renders only while a grouping is applied, and resolves its
column first.** An empty `groupingKeys` suppresses the whole block, functions
and `No Aggregate` together; the grouping commands beside it are untouched,
since they are the entrance to the state that makes the block useful. The
column key goes through `toDeclaredColumnKey` before the capability lookup and
the applied-aggregate check, so a measure offers its source's functions with the
applied one pressed — the same util ADR-100 used to answer "is this a measure",
rather than a second parse of the token.

**A measure starts wider than the column it measures.**
`resolveAggregateColumnMinWidth` floors each derived column at
`DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH` instead of inheriting the source's
`minWidth`. A measure holds the widest value the column ever produces — a sum of
every row — and a share of the grand total puts a bar and a percentage beside
it. The floor never crosses a `maxWidth` the consumer declared, and a source
already wider keeps its width.

## Consequences

**Pinning a subtotal pins its band, and the menu says so before the click.**
That is the behaviour, not a workaround for it: a consumer wanting one measure
pinned alone is asking for the derived columns to become rows of their own in
the drawer, which is the same feature ADR-100's Consequences already tracks for
hiding.

**Two write paths now agree.** Pinning `Sum` from the header menu and from the
drawer produce the same state, and the drawer's Pinning tab opens on the side
the band actually holds rather than on `undefined`.

**A flat grid's menu is shorter.** Consumers who reached the function list
before grouping lose that route; the Grouping tab of the global settings drawer
stages aggregates without a grouping applied, and remains the place to do it.

**A grouped grid's measure columns are wider on upgrade.** Resizing still works
and still persists, keyed by the token.

## Alternatives considered

1. **Pin the measure alone, keyed by its token.** Rejected: `columnPinning` and
   `columnOrder` are persisted and must stay declared-only — ADR-100's Context
   records what happened when a derived key reached them. It also splits a
   header band, which `resolveHeaderBands` cannot draw.
2. **Leave the pinning refused and document the band.** Rejected: the refusal
   costs a real gesture (keeping a subtotal in view) to avoid a wider one the
   band makes coherent, and the `title` can state the width of the gesture just
   as well as it can state a refusal.
3. **Offer the aggregate functions on a flat grid and apply them silently.**
   Rejected: it is the state the report was in when this was raised. A control
   that accepts a click and changes nothing on screen is the failure ADR-100
   exists to remove.
4. **Widen the measure only when a share is on.** Rejected: it needs the
   `shares` list threaded through every caller of `deriveColumnViewState`, and
   it makes a column jump width when a reader toggles the share. A stable floor
   costs a little space on the measures that carry no share.

## References

- [#1054](https://github.com/luciocabrera/lcabrera-stack/issues/1054)
- [ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md) —
  why the measured column is not on screen while grouped.
- [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the force-pin
  and force-show a group key's items would be fighting.
