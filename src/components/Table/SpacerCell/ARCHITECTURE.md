# SpacerCell Architecture

Invisible horizontal spacer cell used by the column virtualisation system
to maintain correct table layout when center columns are not rendered.

## File Structure

```
SpacerCell/
├── SpacerCell.component.tsx   → <td> or <th> spacer with explicit width
├── SpacerCell.types.ts        → SpacerCellProps (isHeader, width)
├── SpacerCell.stylex.ts       → Width + zero-padding styles
└── index.ts                   → Barrel export
```

## Props

| Prop       | Type      | Default | Description                                |
| ---------- | --------- | ------- | ------------------------------------------ |
| `isHeader` | `boolean` | `false` | Renders `<th>` when true, `<td>` otherwise |
| `width`    | `number`  | —       | Pixel width of the spacer cell             |

## Render Output

```
<td aria-hidden="true" style="width: Npx; min-width: Npx; padding: 0; ..." />
```

or, when `isHeader` is `true`:

```
<th aria-hidden="true" style="width: Npx; min-width: Npx; padding: 0; ..." />
```

## Usage

`SpacerCell` is consumed by `TableHeader` and `TableBody`. Each inserts a
left spacer (for columns scrolled off-screen to the left) and a right spacer
(for columns not yet reached) around the visible center column window:

```
[leftPinnedCells] | [SpacerCell left] | [visibleCenterCells] | [SpacerCell right] | [rightPinnedCells]
```

When the spacer width is `0` the cell is not rendered.
