# TableRow Architecture

Styled `<tr>` wrapper that applies striped and header row variants via StyleX.

## File Structure

```
TableRow/
├── TableRow.component.tsx    → <tr> with conditional styles
├── TableRow.types.ts         → TableRowProps extends <div> (isHeader, isStriped)
├── TableRow.stylex.ts        → Base, striped, header style variants
└── index.ts                  → Barrel export
```

## Props

| Prop           | Type           | Default | Description                  |
| -------------- | -------------- | ------- | ---------------------------- |
| `isHeader`     | `boolean`      | `false` | Apply header row styling     |
| `isStriped`    | `boolean`      | `true`  | Apply alternating row colors |
| `customStylex` | `StyleXStyles` | —       | Override styles              |

## Usage

Used by `TableHeader` (with `isHeader`) and `TableBody` (with default striping).
