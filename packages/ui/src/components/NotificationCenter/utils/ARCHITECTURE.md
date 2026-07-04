# NotificationCenter Utilities Architecture

Utilities supporting `NotificationCenter.component.tsx`.

## Purpose

- keep view-only transformation logic out of the component file
- centralise placement grouping and ordering rules
- centralise variant-to-style resolution for the accent rail

## Utilities

- `groupNotificationsByPlacement.util.ts`: builds the placement map used by the component render loop
- `sortNotificationsByNewest.util.ts`: returns newest notifications first without mutating the source array
- `getAccentStyle.util.ts`: maps notification variants to StyleX accent rail styles

## Constants Dependency

- `NotificationCenter.constants.ts`: ordered placement list used to render viewports consistently
