# SpacerRow Architecture

Invisible `<tr>` used by virtualization to pad above/below visible rows,
maintaining correct scroll height without rendering off-screen rows.
The component reads the pinned column partition from the store to compute its own `colSpan`.

## File Structure

```
SpacerRow/
├── SpacerRow.component.tsx   → <tr> with dynamic height via StyleX
├── SpacerRow.types.ts        → SpacerRowProps (height)
├── SpacerRow.stylex.ts       → Dynamic row/cell height styles
└── index.ts                  → Barrel export
```

## Props

| Prop     | Type     | Description                            |
| -------- | -------- | -------------------------------------- |
| `height` | `number` | Spacer height in px (from virtualizer) |

## Context Dependencies

| Selector                      | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `useGetPinnedColumnPartition` | Computes `colSpan` from left + center + right counts |

## Usage

Rendered by `TableBody` as top/bottom spacers around the visible row window.
Marked `aria-hidden` since it carries no semantic content.
