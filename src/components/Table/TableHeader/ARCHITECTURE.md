# TableHeader Architecture

Renders `<thead>` with a single header row. Maps effective columns to
`TableHeaderCell` instances with computed pinned offsets.

## File Structure

```
TableHeader/
├── TableHeader.component.tsx   → <thead> → TableRow → TableHeaderCell[]
├── TableHeader.types.ts        → TableHeaderProps extends <thead>
├── TableHeader.stylex.ts       → Sticky header positioning
└── index.ts                    → Barrel export
```

## Context Dependencies

| Selector                 | Purpose                       |
| ------------------------ | ----------------------------- |
| `useGetEffectiveColumns` | Ordered/filtered column list  |
| `useGetColumnPinning`    | Pinning state for offset calc |
| `useGetColumnSizing`     | Column widths for offset calc |

## Render Flow

```mermaid
graph TD
  TH["TableHeader"] --> EC["useGetEffectiveColumns()"]
  TH --> CP["useGetColumnPinning()"]
  TH --> CS["useGetColumnSizing()"]
  CP --> Offsets["getPinnedColumnOffsets(pinning, sizing, columns)"]
  CS --> Offsets
  EC --> Offsets

  EC --> Map["effectiveColumns.map()"]
  Map --> THC["TableHeaderCell per column"]
  THC --> pinInfo["pinInfo from pinnedOffsets[col.key]"]

  TH --> Row["TableRow (isHeader)"]
  Row --> THC
```

Each `TableHeaderCell` receives `columnKey`, `hasSettings`, and `pinInfo`.
