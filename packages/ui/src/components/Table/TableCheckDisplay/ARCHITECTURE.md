# TableCheckDisplay Architecture

Accessible boolean checkbox display used inside table body cells.
Read-only — shows a check icon overlay when the value is truthy.

## File Structure

```
TableCheckDisplay/
├── TableCheckDisplay.component.tsx   → Accessible label mapping + shared Checkbox composition
├── TableCheckDisplay.test.tsx        → Unit tests for checked and unchecked accessible states
├── TableCheckDisplay.types.ts        → TableCheckDisplayProps (label, value)
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

- `TableCheckDisplay` computes the accessible label from `value` and optional `label`
- Renders the shared `Checkbox` component as disabled + read-only with `tabIndex={-1}`
- Check icon overlay is provided by the shared checkbox implementation when checked
