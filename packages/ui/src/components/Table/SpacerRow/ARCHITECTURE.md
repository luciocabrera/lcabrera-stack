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

## Hidden from the accessibility tree

It stays `aria-hidden='true'` and — unlike every other row — deliberately does
**not** compose `TableRow`, so it declares no `role='row'` and never joins the
grid's row sequence
([ADR-062](../../../../../../docs/decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md)).
The filler that makes the scroll height work is therefore never announced as a
row, and no `aria-rowindex` has to be invented for it.

It carries no `tabIndex` and no focusable descendant, so `aria-hidden` is
correct. Biome flags it anyway — inside a `role="grid"` a row IS focusable, and
the rule cannot see that this row opts out of the grid entirely; the exemption is
argued in `docs/agents/public-package-suppressions.json`.
