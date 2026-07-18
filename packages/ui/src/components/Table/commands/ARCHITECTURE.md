# Table Command Layer

The foundation of the grid interaction architecture (**ADR-011**). It removes the
per-surface duplication of capability _identity_ and _enablement_: the same
"Pin Left" / "Ascending" label, icon, and `current === target` derivation were
re-declared in the header menu and the settings drawer. This layer holds each
once.

## What lives here

| Artifact                           | Kind      | Role                                                                                 |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `CommandDescriptor` / `CommandId`  | type      | Presentation-neutral identity `{ id, label, icon }`. No handler, no enablement.      |
| `deriveToggleCommandState.util.ts` | pure util | Capability-agnostic `{ isActive, isEnabled }` from `{ current, target, isDisabled }` |
| `pinning/pinningCommands.ts`       | constants | `PIN_LEFT_COMMAND`, `PIN_RIGHT_COMMAND`, `CLEAR_PINNING_COMMAND`                     |
| `sorting/sortingCommands.ts`       | constants | `SORT_ASCENDING_COMMAND`, `SORT_DESCENDING_COMMAND`, `CLEAR_SORTING_COMMAND`         |

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
  `PinAndHideActions` (PinLeft/PinRight/ClearPinning) and `SortActions`
  (SortAscending/SortDescending/ClearSorting).
- Settings drawer (draft commit-context): `ColumnSettingsDrawer/PinningSection/`
  and `ColumnSettingsDrawer/SortingSection/`.

Each renders from the shared descriptor + predicate and keeps only its own
presentation and commit-context. The descriptor is an **overridable default** — a
surface may substitute its own icon without forking the identity.

## Generalization — validated (ADR-011 cross-capability check)

Pinning and sorting reuse `CommandDescriptor` **and** `deriveToggleCommandState`
**unchanged**: the enablement derivation is capability-agnostic — "is the column's
current value the command's target, and is the command clickable" — so pinning
passes sides (`'left' | 'right'`) and sorting passes directions
(`'asc' | 'desc'`). That the shared shape absorbed a second, structurally
different-looking capability without modification is the evidence the foundation
is not fitted to pinning.

A new capability adds a sibling `*Commands.ts`. If it cannot reuse
`deriveToggleCommandState` or `CommandDescriptor` unchanged, revise the shared
shape before adding it — that is the signal it was over-fitted.
