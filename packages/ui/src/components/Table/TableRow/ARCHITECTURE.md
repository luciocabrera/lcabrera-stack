# TableRow Architecture

Styled `<tr>` wrapper that applies the configured row height plus striped and
header row variants via StyleX.

## File Structure

```
TableRow/
├── TableRow.component.tsx    → <tr> with conditional styles
├── TableRow.test.tsx         → Unit tests for rendered row, forwarded attributes, row height
├── TableRow.types.ts         → TableRowProps extends <div> (isHeader, isStriped)
├── TableRow.stylex.ts        → Base, height, striped, header style variants
└── index.ts                  → Barrel export
```

## Props

| Prop           | Type           | Default | Description                  |
| -------------- | -------------- | ------- | ---------------------------- |
| `isHeader`     | `boolean`      | `false` | Apply header row styling     |
| `isStriped`    | `boolean`      | `true`  | Apply alternating row colors |
| `customStylex` | `StyleXStyles` | —       | Override styles              |

## Context Dependencies

| Selector               | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `useGetTableRowHeight` | The height every row (header + body) paints |

## Row height is store-driven, never a literal

`TableBody` sizes `<tbody>` as `totalRows × rowHeight` and derives the
virtualization spacers (`offsetY`, `bottomSpacerHeight`) from the same value —
the window math holds exactly because
`offsetY + visibleRows × rowHeight + bottomSpacerHeight === totalHeight`. If a
row paints at any height other than that `rowHeight`, the body's declared height
stops matching its contents: `<tbody>` is `display: grid`, so the leftover space
is redistributed across tracks and rows visibly move as the window scrolls
(cumulative layout shift attributed to `<tr>`).

That is why `TableRow` self-connects to `useGetTableRowHeight()` rather than
hardcoding a height: it keeps the painted row and the virtualization math on one
source of truth. `minHeight`/`maxHeight` are pinned alongside `height` because
the flex row would otherwise grow to fit tall cell content and break the same
identity.

This component previously hardcoded `32px`, which silently made `rowHeight` a
no-op knob — any value other than the default desynchronized the body from its
rows. The `header` variant also declared `height: 40`, which never applied
because `base`'s `maxHeight: 32` outranked it; headers have always painted at
the default row height and now follow `rowHeight` with every other row.

## Usage

Used by `TableHeader` (with `isHeader`) and `TableBodyRows` (with default
striping). Both render inside `TableConfigProvider`, which supplies the meta
store the row height is read from.
