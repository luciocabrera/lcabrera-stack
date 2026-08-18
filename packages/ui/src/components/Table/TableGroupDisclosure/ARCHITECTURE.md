# TableGroupDisclosure Architecture

The chevron a group row is opened and closed by, and the space it reserves on
rows that have nothing to open.

Private delegate of a group key's cell. `TableGroupKeyCell` renders it as the
first thing on the line of the row's **innermost** filled level — never on a
carried one, which is why the innermost level always draws. Nothing outside the
Table uses it.

## File Structure

```
TableGroupDisclosure/
├── TableGroupDisclosure.component.tsx → The chevron, its rotation, its click, or a spacer
├── TableGroupDisclosure.types.ts      → TableGroupDisclosureProps, TableGroupDisclosureState
├── TableGroupDisclosure.stylex.ts     → Fixed box, rotation as state, reduced-motion opt-out
├── TableGroupDisclosure.test.tsx      → Toggle, direction, absence, and the tab-order contract
├── ARCHITECTURE.md                    → This file
└── index.ts                           → Barrel export
```

## Props

| Prop         | Type                                     | Description                                           |
| ------------ | ---------------------------------------- | ----------------------------------------------------- |
| `disclosure` | `TableGroupDisclosureState \| undefined` | `{ hasChildren, isExpanded }` from the group tree     |
| `path`       | `readonly TableGroupKeyValue[]`          | The group this opens — the key expansion is stored by |

## Why it is not a button

This is the decision the component exists to hold, and it looks wrong until the
grid's focus model is in view.

[ADR-062](../../../../../../docs/decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md)
gives the grid a **roving tab stop** addressed by row key plus column key:
exactly one element in the whole grid is tabbable at a time, and which one is
store state. A `<button>` here would insert a second tab stop inside a cell that
already owns one — so tabbing through a grouped body would alternate between
cell and chevron, and the roving model would no longer describe the grid.

The treegrid pattern already answers this. Expansion state belongs to the
**row**, as the `aria-expanded` `resolveTreeRowAriaProps` puts there, and the
disclosure is a pointer affordance rather than a second focus target. So the
chevron is `aria-hidden`, carries no `tabindex`, and the keyboard path stays the
`ArrowRight`/`ArrowLeft` handling in `useMoveTableGridFocus` — which is where it
already was, and which is why this component adds a way in rather than a way
back.

A control announced once as a row state and again as a button is the failure
this avoids, not an accessibility gap it accepts.
`Table.treeExpansion.test.tsx` asserts the tab-stop count over a real grouped
body, because that is the only place the regression shows.

## Why `hasChildren` arrives rather than being derived

Whether a row owns rows is a question about the **other** rows, and rollup
answers it counter-intuitively: a subtotal sits _below_ the rows it totals, so
an adjacency test reports every subtotal as childless and leaves the one row a
user most wants to fold unfoldable. `resolveTableGroupTree` already settles this
off the tree, and the answer travels down the same path the group summary does —
`TableBodyRows` → `renderTableBodyPinnedGroup` → `createRenderTableBodyCell` →
`buildTableBodyCellDescriptor` → `resolveGroupCellChildren` → `TableGroupKeyCell`.

Re-deriving it here would mean resolving the whole tree once per group-key cell,
which is once per visible group row per render.

## Why the spacer exists

A row with nothing under it still renders the box, empty. Without it the labels
of sibling rows would not line up, and indentation — the only thing stating
depth in this column — would read as noise rather than as structure.

## The rotation is the state

One shape at two angles rather than two icons, so the open and closed forms
cannot drift apart, and the change can be animated. It is a `transform`, so it
changes nothing about the row's box: the height `TableRow` pins and `TableBody`
derives `<tbody>`'s height from is untouched
([ADR-065](../../../../../../docs/decisions/ADR-065-grouped-rows-render-a-hierarchy-column.md)).
The transition is dropped under `prefers-reduced-motion`.
