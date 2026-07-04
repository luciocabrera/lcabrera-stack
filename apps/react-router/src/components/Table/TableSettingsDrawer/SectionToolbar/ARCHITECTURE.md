# SectionToolbar Architecture

Shared drawer-section toolbar. Renders a horizontal row of action buttons from a
descriptor list and owns the `footer` / `toolbar` variant presentation. Used by
`FiltersSectionToolbar`, `ColumnOrderSectionToolbar`, and `SortingSectionToolbar`
to avoid triplicating the button-row markup and variant logic.

## File Structure

```
SectionToolbar/
├── SectionToolbar.component.tsx  → Renders buttons + owns variant presentation
├── SectionToolbar.types.ts       → SectionToolbarButton, SectionToolbarProps
├── SectionToolbar.stylex.ts      → container / toolbar layout (drawerSection tokens)
└── index.ts                      → Barrel (SectionToolbar, SectionToolbarButton)
```

## Button Descriptor

Each button is described declaratively; the icon is a component that is invoked
with the variant-resolved icon size so callers never compute sizing themselves.

| Field        | Purpose                                                       |
| ------------ | ------------------------------------------------------------- |
| `icon`       | `ComponentType<IconProps>` — icon component (receives `size`) |
| `isDisabled` | Optional disabled flag                                        |
| `key`        | Stable React key + aria-label + tooltip source                |
| `label`      | Visible label (footer) / tooltip + aria (toolbar)             |
| `onClick`    | Optional click handler                                        |

## Variant Presentation

| Variant   | color     | size   | width  | icon size      | label        |
| --------- | --------- | ------ | ------ | -------------- | ------------ |
| `footer`  | `outline` | `sm`   | `full` | `ICON_SIZE_MD` | visible text |
| `toolbar` | `ghost`   | `mini` | `auto` | `ICON_SIZE_SM` | tooltip only |

## Consumers

- `FiltersSection/FiltersSectionToolbar`
- `ColumnOrderSection/ColumnOrderSectionToolbar`
- `SortingSection/SortingSectionToolbar`
