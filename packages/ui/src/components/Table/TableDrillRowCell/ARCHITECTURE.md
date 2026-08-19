# TableDrillRowCell

What a **grid-created** drill row holds: the state of a group's fetch, or the way
out of it ([ADR-079](../../../../../../docs/decisions/ADR-079-drilling-from-a-group-to-its-rows.md)).

Unlike every other cell here, nothing on these rows comes from a read. The grid
writes them itself, under `TABLE_DRILL_ROW_FIELD`, and `getTableDrillRow` is what
the render path asks — the row is asked what it is, exactly as a group row is.

## File Structure

| File                                      | Role                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `TableDrillRowCell.component.tsx`         | The three kinds, and the hand-off's link                             |
| `TableDrillRowCell.types.ts`              | `TableDrillRowCellProps` — the marker, and nothing else              |
| `TableDrillRowCell.stylex.ts`             | One line, ellipsized, at the store's `rowHeight`                     |
| `utils/resolveDrillHandoffSearch.util.ts` | The hand-off's URL, or `undefined` where it cannot be built honestly |
| `utils/resolveDrillShortfallText.util.ts` | The shortfall, said short on screen and fully to a screen reader     |

## They are rows, because height is counted in rows

`<tbody>` is sized from `rows.length × rowHeight`, so anything occupying vertical
space has to be **in that array** or the declared height stops matching what is
painted ([ADR-065](../../../../../../docs/decisions/ADR-065-grouped-rows-render-a-hierarchy-column.md)).
That rules out an overlay, a spinner floated over the group, and a taller row for
the failure message. `resolveDrilledRows` splices exactly one chrome row per
non-loaded state, and this renders its content.

## One cell holds it; the rest are empty

The content goes in the **first group-key column**. Key columns are hoisted to
the head of the order ([ADR-080](../../../../../../docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)),
so that is the grid's leftmost cell — where a reader already looks for what a row
is about, and directly under the group heading these rows belong to.

**Nothing spans.** A `colSpan` would give this row a different `gridcell` count
from every other row, which `role="grid"` forbids and which the focus model's
column addressing assumes ([ADR-062](../../../../../../docs/decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md)).
A row of empty cells costs nothing and keeps the grid rectangular.

## The three kinds

| Kind      | Holds                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| `loading` | One muted line. Not a skeleton of the page to come — its size is not known until it arrives |
| `failed`  | An icon and a statement, naming **no cause** and naming the gesture that retries            |
| `handoff` | The shortfall, as a link to the same table ungrouped and filtered to this group             |

`failed` names no cause because a refusal and a timeout differ to the server and
not to the reader of one group row. It names the gesture instead — closing and
reopening the group — because `failed` is deliberately **not terminal**, and
nothing else on the row says so.

## The hand-off is a link and is not a tab stop

ADR-062 gives the grid exactly one tab stop, addressed by row key plus column
key. A tabbable anchor here would insert a second one **inside a cell that
already owns it**, so tabbing through the body would alternate between cell and
link — the same reason `TableGroupDisclosure` is not a button.

It differs from the chevron in one way that matters: the chevron is
`aria-hidden`, because `aria-expanded` on the row already states it. Nothing
states this one, so it stays in the accessibility tree with a name that says
where it goes. Its keyboard path is `Enter` on the focused cell, handled once for
any linked cell by `activateGridCellLink` in the grid's key map.

## An unbuildable hand-off is stated, not offered

`resolveDrillHandoffSearch` answers `undefined` when **any** group key cannot be
expressed as a filter — a NULL key (the vocabulary has no "is null" member) or an
object-valued one (`String()` yields `[object Object]`). The cell then states the
shortfall as plain text.

Partial filters are the trap being avoided: they select a **larger** set than the
group, so the link would open a table showing the wrong rows under the right
heading, and every number on the page would look right. Either every key travels
or none does.

## It wires its own state

Filters and columns come from the columns store, not from props. The hand-off's
URL is a question about the whole table's configuration, and a parent passing it
down would have to compute one per drill row in the window — see the thin-shell
rule in [`PATTERNS.md`](../../../PATTERNS.md).
