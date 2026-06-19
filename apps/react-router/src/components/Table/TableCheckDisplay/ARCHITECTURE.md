# TableCheckDisplay Architecture

Accessible boolean checkbox display used inside table body cells.
Read-only — shows a check icon overlay when the value is truthy.

## File Structure

```
TableCheckDisplay/
├── TableCheckDisplay.component.tsx   → Checkbox with ARIA attributes + checked icon overlay
├── TableCheckDisplay.test.tsx        → Unit tests for checked and unchecked accessible states
├── TableCheckDisplay.types.ts        → TableCheckDisplayProps (label, value)
├── TableCheckDisplay.stylex.ts       → Checkbox styling + checked variant
└── index.ts                          → Barrel export
```

## Props

| Prop    | Type      | Description                             |
| ------- | --------- | --------------------------------------- |
| `value` | `unknown` | Truthy → checked, falsy → unchecked     |
| `label` | `string?` | Column label for accessible description |

## Accessibility

- `role="checkbox"` with `aria-checked` and `aria-label`
- Label format: `"ColumnLabel: Yes/No"` when label provided

## Render Structure

- Root wrapper `<span>` with `position: relative`
- Disabled read-only `<input type="checkbox">` as the semantic control
- Conditional icon overlay (`CheckIcon` sized with `ICON_SIZE_XXS`) rendered only for checked state
