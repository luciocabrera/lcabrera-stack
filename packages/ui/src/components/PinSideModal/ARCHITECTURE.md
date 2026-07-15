# PinSideModal Architecture

Confirmation modal for choosing which side to pin a table column to. A thin,
store-agnostic wrapper that configures the shared [`ChoiceModal`](../ChoiceModal/ARCHITECTURE.md)
with the pin-side title, copy, and options — it holds no state of its own; the
selection state and the reset-on-open/close behavior live in `ChoiceModal`.

## File Structure

```
PinSideModal/
├── index.ts                        → Barrel export
├── PinSideModal.component.tsx      → Configures ChoiceModal for pin-side selection
└── PinSideModal.types.ts           → PinSideModalProps
```

## Dependencies

```mermaid
graph LR
  PSM["PinSideModal"] --> ChoiceModal
  PSM --> PIN_SIDE_OPTIONS["PIN_SIDE_OPTIONS (constants/pinningPreferences)"]
  PSM --> PinSide["PinSide (type from types/ui.types)"]
```

## Component Hierarchy

```mermaid
graph TD
  PSM["PinSideModal"] --> CM["ChoiceModal (title='Pin Column', radioName='pin-side-selection')"]
  CM --> Desc["p.description — column label text"]
  CM --> ROG["RadioOptionGroup (PIN_SIDE_OPTIONS)"]
  CM --> FooterButtons["ActionButtons (Accept / Cancel)"]
```

## State & Flow

`PinSideModal` is purely declarative: it forwards `isOpen`/`onAccept`/`onCancel`
and supplies `defaultValue='closest-edge'`. The selected side is tracked inside
`ChoiceModal`, which calls `onAccept(selectedSide)` on Accept and resets to
`defaultValue` after both Accept and Cancel so the modal opens fresh next time.

## Radio Options

| `value`          | `label`          | `description`                                    |
| ---------------- | ---------------- | ------------------------------------------------ |
| `'closest-edge'` | Closest edge     | Pin to the nearest edge based on column position |
| `'left'`         | Pin to the left  | Pin this column to the left side of the table    |
| `'right'`        | Pin to the right | Pin this column to the right side of the table   |

## Props

| Prop          | Type                      | Description                                             |
| ------------- | ------------------------- | ------------------------------------------------------- |
| `columnLabel` | `string`                  | Name of the column being pinned (shown in description)  |
| `isOpen`      | `boolean`                 | Controls Modal visibility                               |
| `onAccept`    | `(side: PinSide) => void` | Called with the chosen `PinSide` when Accept is clicked |
| `onCancel`    | `() => void`              | Called when Cancel is clicked or modal is closed        |

## `PinSide` Values (from `types/ui.types`)

| Value            | Meaning                                  |
| ---------------- | ---------------------------------------- |
| `'closest-edge'` | Resolve to nearest edge at drop/pin time |
| `'left'`         | Explicitly pin to left side              |
| `'right'`        | Explicitly pin to right side             |

## Consumers

Used by `TableSettingsDrawer` / `TableHeaderCell` when a pin action would conflict with the column's current position and the user needs to resolve which side explicitly. Its store-connected owner is `ColumnOrderPinSideModal`.
