# NotificationCenter Architecture

Renders active notifications from `NotificationContext`.

## Purpose

Reusable viewport-based notification UI with:

- corner placement (`top-left`, `top-right`, `bottom-left`, `bottom-right`)
- Card-based variants
- bottom-to-top entry motion
- manual dismiss button per notification

## Composition

- `NotificationCenter.component.tsx`: groups notifications by placement and renders stacks
- `NotificationCenter.stylex.ts`: viewport, stack, and animation styles
- `NotificationCenter.types.ts`: local view props and placement map types

## Behavior

- reads notifications through `useNotifications`
- groups by placement
- renders one fixed viewport per placement with active items
- uses a high fixed stacking layer so notifications render above drawers/popovers
- wraps each notification card in an elevated opaque surface for better readability when semantic card colors are translucent
- dismiss button calls `dismissNotification(id)`
