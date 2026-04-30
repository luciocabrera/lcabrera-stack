# NotificationCenter Architecture

Renders active notifications from `NotificationContext`.

## Purpose

Reusable viewport-based notification UI with:

- corner placement (`top-left`, `top-right`, `bottom-left`, `bottom-right`)
- Card-based variants
- bottom-to-top entry motion
- manual dismiss button per notification

## Composition

- `NotificationCenter.component.tsx`: reads context state and renders stacks from precomputed constants/utils
- `NotificationCenter.constants.ts`: ordered placement list for viewport rendering
- `NotificationCenter.stylex.ts`: viewport, stack, and animation styles
- `NotificationCenter.types.ts`: local view props and placement map types
- `utils/groupNotificationsByPlacement.util.ts`: groups notifications into placement buckets
- `utils/sortNotificationsByNewest.util.ts`: returns newest notifications first without mutating state
- `utils/getAccentStyle.util.ts`: maps notification variants to accent rail styles

## Behavior

- reads notifications through `useNotifications`
- groups by placement via a dedicated utility that creates fresh arrays per placement bucket
- renders one fixed viewport per placement with active items
- uses a high fixed stacking layer so notifications render above drawers/popovers
- renders notifications as opaque default cards with a left accent rail derived from the notification variant
- dismiss button calls `dismissNotification(id)`
