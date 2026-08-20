# Table Command Layer

The foundation of the grid interaction architecture (**ADR-011**). It removes the
per-surface duplication of capability _identity_ and _enablement_: the same
"Pin Left" / "Ascending" label, icon, and `current === target` derivation were
re-declared in the header menu and the settings drawer. This layer holds each
once.

## What lives here

| Artifact                              | Kind      | Role                                                                                                                                                                                                                |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommandDescriptor` / `CommandId`     | type      | Presentation-neutral identity `{ id, label, icon }`. No handler, no enablement.                                                                                                                                     |
| `deriveToggleCommandState.util.ts`    | pure util | Capability-agnostic `{ isActive, isEnabled }` from `{ current, target, isDisabled }`; `isDisabled` comes from `resolveColumnCapabilities`                                                                           |
| `deriveAggregateCommandState.util.ts` | pure util | The aggregate commands' own `{ isActive, isEnabled }`, from `{ applied, columnKey, target, isDisabled }` — see below for why it is beside the toggle rather than inside it                                          |
| `pinning/pinningCommands.ts`          | constants | `PIN_LEFT_COMMAND`, `PIN_RIGHT_COMMAND`, `CLEAR_PINNING_COMMAND`                                                                                                                                                    |
| `sorting/sortingCommands.ts`          | constants | `SORT_ASCENDING_COMMAND`, `SORT_DESCENDING_COMMAND`, `CLEAR_SORTING_COMMAND`                                                                                                                                        |
| `grouping/groupingCommands.ts`        | constants | `GROUP_BY_COLUMN_COMMAND`, `CLEAR_GROUPING_COMMAND`, `EXPAND_ALL_GROUPS_COMMAND`, `COLLAPSE_ALL_GROUPS_COMMAND`, `AGGREGATE_COMMANDS` (a `Record` closed over `TableAggregateFn`), `CLEAR_COLUMN_AGGREGATE_COMMAND` |

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
  (GroupByColumn/ClearGrouping/ExpandAllGroups/CollapseAllGroups plus the
  aggregation-mode block).
- Settings drawer (draft commit-context): `ColumnSettingsDrawer/PinningSection/`
  and `ColumnSettingsDrawer/SortingSection/`.

## Two derivations, and the split is load-bearing

`deriveToggleCommandState` answers "is the column's current value this command's
target". That is exact for a **single-valued** capability: a column has one pin
side and one sort direction, so picking `asc` un-picks `desc` and at most one
item is ever active.

An aggregate is not single-valued. A column may carry `sum` and `avg` at once
(#831), so the same question is membership rather than equality and several items
in one menu are active together — a state the toggle derivation cannot express.
Widening the shared helper to take a collection would have made **sorting** able
to express it too, which is a state sorting does not have and must not gain. So
the aggregates got `deriveAggregateCommandState` beside it, keeping everything
else identical: the clear command is still `target: undefined`, `isDisabled`
still comes from the surface, and the state source is still the surface's own
selector.

The fold pair is the one set here that asks nothing of a column. `EXPAND_ALL_`
and `COLLAPSE_ALL_GROUPS_COMMAND` are commands of the grouped **body**, so their
ids carry no `column.` prefix and their enablement comes from the rows rather
than from `resolveColumnCapabilities` — `useTableGroupFoldAll` reads the same
foldable set the per-row chevrons are drawn from (#774).

Every consumer resolves its own capability and passes it as `isDisabled`, and
**the capability is the one that governs that command, not the one its neighbour
uses**. Most are per-column, resolved from the column
(`useGetNormalizedColumn` + `resolveColumnCapabilities`, `Table/utils/`): sorting
commands are unavailable on a non-sortable column, pinning commands on a static
one, and "Group by This" on a column declared `isGroupable: false` (which is how
the row-actions column is excluded, rather than by a `key === 'actions'` test).

"Group by This" resolves through **`resolveGroupKeyAvailability`** rather than
`resolveColumnCapabilities` directly, because grouping is the one capability with
a second gate: the catalogue's per-column answer, shipped on the loader meta
(ADR-058/ADR-063), narrows the declared flag. The util composes the two, so this
command's `isDisabled` and the drawer's add-key list cannot come to disagree
(ADR-068). Three details that look like exceptions and are not:

- The refusal reason rides the disabled item's `title`, because a disabled button
  fires no pointer events and so can carry no tooltip.
- **No** gate, refusal or depth cap, disables the item while the column is
  already a key: that click removes rather than adds, and a URL can seed a
  grouping the catalogue refuses today.
- Which is why `title` is gated on **`!isEnabled`** rather than on the refusal
  alone. Both follow from one condition, so the explanation cannot land on the
  applied-key item that is about to _ungroup_. A `title` saying why a command is
  unavailable, on a command that is available, is worse than no title.

`resolveGroupKeyAvailability` also settles the **precedence** between the two
gates: a column the consumer declared `isGroupable: false` reports no reason at
all, even when the catalogue refuses it too. That unavailability is the table's
own decision — not something the endpoint said, and not something the user can
act on — so quoting a distinct-value sentence there would blame the wrong party.

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

## Generalization — validated, and where it forked (ADR-011 cross-capability check)

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

**The aggregation-mode commands are the fourth capability, and the one that
forked.** They reuse `CommandDescriptor` unchanged, so the _identity_ half of the
check holds for all four; their `{ isActive, isEnabled }` comes from
**`deriveAggregateCommandState`** instead of the shared toggle predicate (#831).
The store holds an **ordered list** of `(columnKey, fn)` records — not one
function per column — so there is no single `current` for `target` to be compared
against, and the derivation takes the whole list plus a `columnKey` and narrows
it itself. That is why each surface can hand it its own store's list untouched,
exactly as it hands the toggle helper its own `current`.

The fork is a property of the capability, not a shortfall in the helper, and it
is argued in full under "Two derivations, and the split is load-bearing" above:
sorting and pinning are single-valued by their own semantics, and widening the
shared predicate to a collection would have let sorting express a state it does
not have and must not gain. So this is one function forking, not the layer —
`CLEAR_COLUMN_AGGREGATE_COMMAND` is still the `target: undefined` clear,
`isDisabled` still arrives from the surface, and the state still comes from the
surface's own selector.

Two further things separate the aggregation commands from the grouping pair
above. `CLEAR_COLUMN_AGGREGATE_COMMAND` **does** take a `columnKey`, unlike
`CLEAR_GROUPING_COMMAND`, because an aggregate belongs to one column while
grouping belongs to the table — and it clears **every** function on that column,
which the list shape makes a distinct act from toggling one of them off. And
their `isDisabled` is not a column capability at all: _which_ commands are
rendered is decided by **`resolveOfferableAggregates`** (`Table/utils/`), so an
unofferable one is never offered rather than offered-and-disabled — the menu is
shorter for a `text` column than for a `numeric` one (ADR-058, #550).

That resolver is the aggregation counterpart of `resolveGroupKeyAvailability`
above, and it exists for the same reason: two gates, composed once rather than
spelled per surface. It narrows the catalogue's type answer by whether the
column is an **active group key**, in which case it offers nothing at all — a
grouped column renders its key's value rather than a measure, so an aggregate
chosen on it could never be shown (ADR-080). `AggregateActions` had only the
first gate while the drawer's "Add Aggregate" picker had both, so the menu went
on offering functions the picker had already dropped, and clicking one wrote the
grouping store and changed nothing on screen (#830). Both call the resolver now,
each feeding it its own commit context's grouping keys — the live ones in the
header, the draft in the drawer.

The whole block leaves through **one** early return, whichever gate closed it.
Splitting the two conditions into two exits is how the never-offered rule
decays into a separator or a lone clear item with no functions above it.

**The never-offered rule reaches the two surfaces differently, and only here does
it leave an applied function standing** (#841). These commands toggle, so the item
for an applied function is the only affordance that removes it — dropping it would
make an aggregate applied from this menu unclearable from this menu. The drawer's
"Add Aggregate" picker only adds, so there the same item is a guarded no-op, and
it is subtracted by `resolveAddableAggregates` composing on top of the shared
resolver rather than by changing it. Same rule, opposite conclusions, because the
gestures differ.

A new capability adds a sibling `*Commands.ts`. If it cannot reuse
`CommandDescriptor` unchanged, revise the shared shape before adding it — that is
the signal the identity was over-fitted, and it has not happened yet.

The derivation is where that rule has a second branch, which aggregation is the
worked example of: reuse `deriveToggleCommandState` while the capability's state
is single-valued, and when it is not, add a derivation beside it rather than
widening the shared one. The test is what widening would cost the capabilities
already using it — if it would hand one of them a state it must not be able to
express, the answer is a second derivation, not a wider first. Keep everything
around it identical, so the split stays confined to the one function that has to
differ.
