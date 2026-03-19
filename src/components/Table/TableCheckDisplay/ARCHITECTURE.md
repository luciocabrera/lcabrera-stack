# TableCheckDisplay Architecture

Accessible boolean checkbox display used inside table body cells.
Read-only — shows a check icon when the value is truthy.

## File Structure

```
TableCheckDisplay/
├── TableCheckDisplay.component.tsx   → Checkbox with ARIA attributes
├── TableCheckDisplay.types.tsx       → TableCheckDisplayProps (label, value)
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
