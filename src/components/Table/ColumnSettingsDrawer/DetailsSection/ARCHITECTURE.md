# DetailsSection Architecture

Read-only display of column metadata. No actions or state mutations — purely
informational, reading from `TableConfigContext` via `useGetNormalizedColumn`.

## File Structure

```
DetailsSection/
├── index.ts                       → Barrel export
├── DetailsSection.component.tsx   → Metadata list with badge styling
├── DetailsSection.types.ts        → Props + DetailItem type
├── DetailsSection.stylex.ts       → Full custom styles (base.stylex + colors.stylex)
│
└── utils/
    ├── index.ts                   → Barrel export
    └── getBadgeStyle.util.ts      → Maps "Yes"/"No"/"None" → badge color style
```

## Dependencies

```mermaid
graph LR
  DS["DetailsSection"] --> useGetNormalizedColumn["useGetNormalizedColumn (TableConfig selector)"]
  DS --> getBadgeStyle["getBadgeStyle util"]

  getBadgeStyle --> DS_stylex["DetailsSection.stylex"]
  DS_stylex --> base_stylex["base.stylex (borderRadius, spacing, typography)"]
  DS_stylex --> colors_stylex["colors.stylex"]
```

## Render Flow

```mermaid
graph TD
  A["Receive columnKey prop"] --> B["useGetNormalizedColumn → column config"]
  B --> C["Build details array"]
  C --> D["Map over details"]
  D --> E{"isBadge?"}
  E -->|Yes| F["Render badge span with getBadgeStyle()"]
  E -->|No| G{"isMono?"}
  G -->|Yes| H["Render mono-font span"]
  G -->|No| I["Render regular value span"]
```

## Detail Items Rendered

| Label          | Value Source           | Display Mode |
| -------------- | ---------------------- | ------------ |
| Label          | `column.label`         | Text         |
| Key            | `column.key`           | Mono font    |
| Data Type      | `column.dataType`      | Text (or —)  |
| Sortable       | `column.isSortable`    | Badge        |
| Filterable     | `column.isFilterable`  | Badge        |
| Sort Direction | `column.sortDirection` | Badge        |
| Min Width      | `column.minWidth`      | Text (or —)  |
| Max Width      | `column.maxWidth`      | Text (or —)  |

## Badge Color Mapping

| Value   | Style       | Semantic                      |
| ------- | ----------- | ----------------------------- |
| `"Yes"` | `badgeYes`  | Success (green background)    |
| `"No"`  | `badgeNo`   | Error (red background)        |
| Other   | `badgeNone` | Neutral (tertiary background) |

## Props

| Prop        | Type             | Description       |
| ----------- | ---------------- | ----------------- |
| `columnKey` | `DataKey<TData>` | Column identifier |

## Style Composition

Unlike other sections that delegate to `drawerSectionStyles`, DetailsSection defines
its own complete styles using `base.stylex` and `colors.stylex` tokens directly:

- **container**: Flex column, no gap
- **item**: Row with space-between, bottom border separator
- **label**: Uppercase, secondary color, xs font
- **value**: Primary color, sm font, right-aligned
- **badge**: Rounded pill with color-coded background
- **mono**: Monospace font for the column key
