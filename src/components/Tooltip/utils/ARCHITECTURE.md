# Tooltip utils/ Architecture

Pure helper functions for tooltip arrow positioning.

## File Structure

```
utils/
├── index.ts                    → Barrel export
├── getArrowOffset.util.ts      → Compute arrow pixel offset along the placement axis
└── getArrowStyle.util.ts       → Pick the correct StyleX dynamic style for the offset
```

## Dependencies

```mermaid
graph LR
  GAO["getArrowOffset()"] --> constants["Tooltip.constants (HALF_ARROW = 6px)"]
  GAS["getArrowStyle()"] --> stylex["Tooltip.stylex (arrowPositionHorizontal, arrowPositionVertical)"]
  GAS --> types["Tooltip.types (TooltipPlacement)"]
```

## `getArrowOffset`

Positions the arrow so it visually points at the horizontal/vertical centre of the trigger element.

```
offset = triggerCenter - tooltipStart - HALF_ARROW
```

| Param           | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `triggerCenter` | Centre of the trigger along the relevant axis (px)                |
| `tooltipStart`  | Leading edge of the tooltip box along the same axis (px)          |
| `HALF_ARROW`    | Half of `arrowSize` token (6 px) — centres the arrow on the pixel |

The result is applied as a `left` (horizontal) or `top` (vertical) offset on the arrow element.

## `getArrowStyle`

Selects the appropriate dynamic StyleX style based on placement axis:

| Placement           | Style applied                     |
| ------------------- | --------------------------------- |
| `'top'`, `'bottom'` | `arrowPositionHorizontal(offset)` |
| `'left'`, `'right'` | `arrowPositionVertical(offset)`   |
