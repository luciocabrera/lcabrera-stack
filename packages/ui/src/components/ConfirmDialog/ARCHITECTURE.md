# ConfirmDialog Architecture

Generic yes/no confirmation prompt built on `Modal` — no dependency on
`Form` or any other consumer. First real use is Form's discard-unsaved-
changes-on-cancel flow (see `Form/ARCHITECTURE.md`), but it's reusable
anywhere a destructive or irreversible action needs an explicit second
confirmation.

## Props

- `title` (required), `description` (optional).
- `confirmLabel`/`cancelLabel` — default `'Confirm'`/`'Cancel'`.
- `isOpen`, `onConfirm`, `onCancel` — fully controlled, mirrors `Modal`'s
  own `isOpen`/`onClose` contract (`onCancel` doubles as `Modal`'s
  `onClose`, since dismissing the dialog any other way — Esc, backdrop —
  is equivalent to cancelling).
