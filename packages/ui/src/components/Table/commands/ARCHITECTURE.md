# Table Command Layer

The foundation of the grid interaction architecture (**ADR-011**). It removes the
per-surface duplication of capability _identity_ and _enablement_: the same
"Pin Left" / "Ascending" label, icon, and `current === target` derivation were
re-declared in the header menu and the settings drawer. This layer holds each
once.

## What lives here

| Artifact                           | Kind      | Role                                                                                                                                                    |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommandDescriptor` / `CommandId`  | type      | Presentation-neutral identity `{ id, label, icon }`. No handler, no enablement.                                                                         |
| `deriveToggleCommandState.util.ts` | pure util | Capability-agnostic `{ isActive, isEnabled }` from `{ current, target, isDisabled }`; `isDisabled` comes from `resolveColumnCapabilities`               |
| `pinning/pinningCommands.ts`       | constants | `PIN_LEFT_COMMAND`, `PIN_RIGHT_COMMAND`, `CLEAR_PINNING_COMMAND`                                                                                        |
| `sorting/sortingCommands.ts`       | constants | `SORT_ASCENDING_COMMAND`, `SORT_DESCENDING_COMMAND`, `CLEAR_SORTING_COMMAND`                                                                            |
| `grouping/groupingCommands.ts`     | constants | `GROUP_BY_COLUMN_COMMAND`, `CLEAR_GROUPING_COMMAND`, `AGGREGATE_COMMANDS` (a `Record` closed over `TableAggregateFn`), `CLEAR_COLUMN_AGGREGATE_COMMAND` |

## What deliberately does **not** live here

- **Handlers** — stay in the existing action hooks (`useSetColumnPinning` /
  `useSetColumnSorting`, live and draft). A command is identity + derivation, not
  the effect.
- **Enablement/active-state as data** — it is a _pure predicate fed by each
  surface's own selector_, never a field on the descriptor. Putting `isEnabled` on
  the object would force a coarse store snapshot and defeat the granular
  `useSyncExternalStore` subscriptions (ADR-003). The header feeds the predicate
  from live state; the drawer feeds it from its **draft** store, so the drawer
  reflects pending edits while open.
- **The command registry** (`CommitContext`/`runners` map, an iterable registry,
  per-command adapters, the command palette) — deferred until a command-iterating
  surface exists (ADR-011, registry-deferral boundary).

## Consumers

- Header menu (live commit-context): `TableHeaderCell/TableHeaderActionsMenu/` —
  `PinAndHideActions` (PinLeft/PinRight/ClearPinning), `SortActions`
  (SortAscending/SortDescending/ClearSorting) and `GroupActions`
  (GroupByColumn/ClearGrouping plus the aggregation-mode block).
- Settings drawer (draft commit-context): `ColumnSettingsDrawer/PinningSection/`
  and `ColumnSettingsDrawer/SortingSection/`.

Every consumer resolves its own capability and passes it as `isDisabled`, and
**the capability is the one that governs that command, not the one its neighbour
uses**. Most are per-column, resolved from the column
(`useGetNormalizedColumn` + `resolveColumnCapabilities`, `Table/utils/`): sorting
commands are unavailable on a non-sortable column, pinning commands on a static
one, and "Group by This" on a column declared `isGroupable: false` (which is how
the row-actions column is excluded, rather than by a `key === 'actions'` test).

"Clear Grouping" is the exception, and the reason this paragraph now spells the
rule out. Grouping is one **whole-table** state, so clearing it depends on
nothing about the column whose menu is open — it reads the route capability
instead, and takes no `columnKey` at all so there is nothing to gate on by
mistake. A command whose scope is the table cannot borrow a column's predicate
just because it sits beside commands that do; that pairing looks symmetric and
is not, which is exactly where a copy-paste survives review. So each surface's rendering gate and each
command's own enabled-state come from the same resolver rather than from a
hand-spelled predicate per site.

Each renders from the shared descriptor + predicate and keeps only its own
presentation and commit-context. The descriptor is an **overridable default** — a
surface may substitute its own icon without forking the identity.

## Generalization — validated (ADR-011 cross-capability check)

Pinning, sorting and grouping reuse `CommandDescriptor` **and**
`deriveToggleCommandState` **unchanged**: the enablement derivation is
capability-agnostic — "is the column's current value the command's target, and is
the command clickable" — so pinning passes sides (`'left' | 'right'`), sorting
passes directions (`'asc' | 'desc'`), and grouping passes column keys with the
_applied_ key as `current`. That the shared shape absorbed two further,
structurally different-looking capabilities without modification is the evidence
the foundation is not fitted to pinning.

Grouping stretches it in a direction the first two did not: it is a whole-table
state expressed through a per-column command, so `current` is the same value for
every column's menu while `target` differs. The predicate answers that correctly
without a change, which is the point.

**The aggregation-mode commands are the fourth capability, and they too reuse
`deriveToggleCommandState` unchanged.** An aggregate is a toggle-to-a-value
command exactly as a sort direction is: `current` is the function applied to this
column, `target` is the one this item applies, and `CLEAR_COLUMN_AGGREGATE_COMMAND`
is the `target: undefined` clear. That is the reason the store holds **one**
aggregate per column rather than a set — a set is not a toggle, and would have
needed a derivation of its own beside the shared one.

Two things separate them from the grouping pair above. `CLEAR_COLUMN_AGGREGATE_COMMAND`
**does** take a `columnKey`, unlike `CLEAR_GROUPING_COMMAND`, because an
aggregate belongs to one column while grouping belongs to the table. And their
`isDisabled` is not a column capability at all: _which_ commands are rendered is
decided by the catalogue answer on `metaState.groupingCapabilities`, so an
illegal one is never offered rather than offered-and-disabled — the menu is
shorter for a `text` column than for a `numeric` one (ADR-058, #550).

A new capability adds a sibling `*Commands.ts`. If it cannot reuse
`deriveToggleCommandState` or `CommandDescriptor` unchanged, revise the shared
shape before adding it — that is the signal it was over-fitted.
