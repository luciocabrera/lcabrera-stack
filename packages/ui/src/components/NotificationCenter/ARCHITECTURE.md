# NotificationCenter Architecture

Renders active notifications from `NotificationContext`.

## Purpose

Reusable viewport-based notification UI with:

- corner placement (`top-left`, `top-right`, `bottom-left`, `bottom-right`)
- Card-based variants
- bottom-to-top entry motion
- manual dismiss button per notification
- top-layer rendering via the Popover API so notifications remain visible above modal dialogs

## Composition

- `NotificationCenter.component.tsx`: reads context state and renders stacks from precomputed constants/utils
- `NotificationItem/NotificationItem.component.tsx`: private delegate that renders one notification card row and dismiss control
- `NotificationItem/NotificationItem.stylex.ts`: item-level presentation (entry animation, content layout, accent rail, hover elevation)
- `NotificationItem/NotificationItem.types.ts`: private delegate props
- `NotificationCenter.constants.ts`: ordered placement list for viewport rendering
- `NotificationCenter.stylex.ts`: viewport and stack layout styles
- `NotificationCenter.types.ts`: local view props and placement map types
- `utils/groupNotificationsByPlacement.util.ts`: groups notifications into placement buckets
- `utils/sortNotificationsByNewest.util.ts`: returns newest notifications first without mutating state
- `utils/getAccentStyle.util.ts`: maps notification variants to accent rail styles consumed by `NotificationItem`
- `utils/getNotificationCardColor.util.ts`: maps notification variants to semantic Card color consumed by `NotificationItem`

## Behavior

- reads notifications through `useNotifications`
- groups by placement via a dedicated utility that appends into fresh per-placement arrays from a local map
- renders one fixed viewport per placement with active items
- opens each active viewport as a manual popover so the host enters the browser top layer
- renders notifications as composed Card surfaces with a left accent rail derived from variant
- applies semantic Card `error` styling for error notifications (red border + subtle error background)
- applies a subtle hover elevation effect to keep visual parity with hoverable card affordances
- dismiss button calls `dismissNotification(id)`
