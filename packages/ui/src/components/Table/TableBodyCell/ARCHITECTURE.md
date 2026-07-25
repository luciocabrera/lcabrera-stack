# TableBodyCell Architecture

Data cell that auto-detects the data type and renders formatted content
with support for pinning, loading overlays, and custom render functions.

## File Structure

```
TableBodyCell/
├── TableBodyCell.component.tsx   → <td> with auto-format + pinning + shimmer
├── TableBodyCell.types.ts        → TableBodyCellProps (value, pinInfo, format, ...)
├── TableBodyCell.stylex.ts       → Alignment, pinning offsets, shimmer overlay
├── index.ts                      → Barrel export
│
└── utils/
    ├── detectDataType.util.ts     → Infer type from value (boolean/number/currency/date/string)
    ├── renderCellContent.util.tsx  → Format + render based on data type
    └── index.ts
```

## Props

| Prop       | Type                   | Description                               |
| ---------- | ---------------------- | ----------------------------------------- |
| `value`    | `unknown`              | Cell data value                           |
| `dataType` | `TableColumnDataType?` | Override auto-detected type               |
| `format`   | `TableColumnFormat?`   | Formatting options (currency/date/number) |
| `label`    | `string?`              | Column label for accessibility            |
| `pinInfo`  | `PinnedColumnInfo?`    | Pin side, offset, shadow flags            |
| `minWidth` | `number?`              | Minimum cell width                        |
| `width`    | `number?`              | Current cell width, in pixels             |
| `children` | `ReactNode?`           | Custom content (overrides default)        |
| `locale`   | `string?`              | Locale for formatting                     |

## Rendering Pipeline

```mermaid
graph TD
  Cell["TableBodyCell"] --> HasChildren{"children provided?"}
  HasChildren -->|Yes| Custom["Render children as-is"]
  HasChildren -->|No| Detect["detectDataType(value)"]
  Detect --> Render["renderCellContent({ dataType, format, locale, value })"]

  Render --> Bool{"boolean?"}
  Bool -->|Yes| Check["TableCheckDisplay"]

  Render --> Curr{"currency?"}
  Curr -->|Yes| FmtC["formatCurrency()"]

  Render --> Date{"date?"}
  Date -->|Yes| FmtD["formatDate()"]

  Render --> Num{"number?"}
  Num -->|Yes| FmtN["formatNumber()"]

  Render --> Str{"string?"}
  Str -->|Yes| Raw["Display raw string"]
```

## Auto-Detection Rules (`detectDataType`)

| Value Pattern        | Detected Type |
| -------------------- | ------------- |
| `typeof boolean`     | `boolean`     |
| `typeof number`      | `number`      |
| Starts with `$€£¥₹`  | `currency`    |
| Matches `YYYY-MM-DD` | `date`        |
| Everything else      | `string`      |

## Blank Values

A blank value renders as an empty cell for **every** data type — `number` and `currency` included. `renderCellContent` treats an empty/whitespace-only string as absent rather than parsing it, because `Number('')` is `0` (not `NaN`) and would otherwise format as `0` / `$ 0.00`. This keeps the skeleton loading state consistent, since `generatePlaceholderData` fills every column with `''` regardless of type. A real `0` still formats normally.

## Alignment

- **Right-aligned**: number, currency
- **Centered**: boolean, date
- **Left-aligned** (default): string, custom content

## Loading State

Body cells receive `isLoadingState` from `TableBody` and render their local
shimmer overlay without subscribing to loading state individually.
