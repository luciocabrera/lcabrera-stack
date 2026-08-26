# ADR-001: Native `<dialog>` for Modal

**Status:** Accepted

## Context

The app needs a modal component. Options considered: a React portal + div overlay, a headless library (Radix, Headless UI), or the native HTML `<dialog>` element.

## Decision

Use the native `<dialog>` element with `showModal()` / `close()`.

## Reasons

- **Focus trap built-in** — `showModal()` traps focus inside the dialog automatically; no JS library needed.
- **Esc key built-in** — fires a native `close` event which we listen to and forward as `onClose()`.
- **Top layer** — native dialog uses the browser's top-layer stack, so `z-index` conflicts are impossible.
- **`::backdrop`** — styled via CSS pseudo-element; no extra overlay div needed.
- **Zero deps** — no headless library to pin, update, or bundle.

## Consequences

- `dialog.showModal()` / `dialog.close()` must be called imperatively via `useRef` — cannot be purely declarative.
- Two `useEffect`s are required: one to sync `isOpen` → `showModal/close`, one to listen for the native `close` event (Esc).
- Backdrop click-to-close is not natively provided and must be added manually if needed.
- Browser support is excellent (all modern browsers since 2022).
