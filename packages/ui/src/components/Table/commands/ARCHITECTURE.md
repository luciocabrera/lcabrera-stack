# Table Command Layer

The foundation of the grid interaction architecture (**ADR-011**). It removes the
per-surface duplication of capability _identity_ and _enablement_: today the same
"Pin Left" label, icon, and `side === 'left'` derivation are re-declared in the
header menu and the settings drawer. This layer holds each once.

## What lives here

| Artifact                                | Kind      | Role                                                                                      |
| --------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `CommandDescriptor` / `CommandId`       | type      | Presentation-neutral identity: `{ id, label, icon }`. No handler, no enablement.          |
| `pinning/pinningCommands.ts`            | constants | `PIN_LEFT_COMMAND`, `PIN_RIGHT_COMMAND`, `CLEAR_PINNING_COMMAND` — identity, defined once |
| `pinning/derivePinCommandState.util.ts` | pure util | `{ isActive, isEnabled }` from `{ currentSide, targetSide, isStatic }`                    |

## What deliberately does **not** live here

- **Handlers** — stay in the existing action hooks (`useSetColumnPinning`, live and
  draft). A command is identity + derivation, not the effect.
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

- Header menu (live commit-context): `TableHeaderCell/TableHeaderActionsMenu/PinAndHideActions/`
  — `PinLeftButton`, `PinRightButton`, `ClearPinningButton`.
- Settings drawer (draft commit-context): `ColumnSettingsDrawer/PinningSection/`.

Each renders from the shared descriptor + predicate and keeps only its own
presentation and commit-context. The descriptor is an **overridable default** — a
surface may substitute its own icon without forking the identity.

## Extending

A new capability adds a sibling folder (`sorting/`, `grouping/`, …) with the same
shape: a `*Commands.ts` constants file and a `derive*CommandState.util.ts`
predicate. If a capability cannot adopt `CommandDescriptor` unchanged, revise the
type before adding it — that is the signal the shape was fitted to one capability
(ADR-011, validation).
