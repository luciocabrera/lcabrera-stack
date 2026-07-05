# NotificationItem Architecture

Private delegate used by `NotificationCenter` to render a single notification row.

## Purpose

- keep `NotificationCenter` focused on placement/stack orchestration
- isolate notification-card presentation concerns (surface, accent rail, title/message layout)
- encapsulate dismiss-button interaction per notification

## Composition

- `NotificationItem.component.tsx`: renders one notification card and handles dismiss callback dispatch
- `NotificationItem.stylex.ts`: item-level entry animation, accent surface, hover elevation, and content typography
- `NotificationItem.types.ts`: readonly props contract for notification + dismiss callback
