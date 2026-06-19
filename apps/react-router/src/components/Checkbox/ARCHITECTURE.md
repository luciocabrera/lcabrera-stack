# Checkbox Architecture

Reusable controlled checkbox with custom visual styling and a check icon overlay.
Used by table checkbox display and VirtualList checkbox rows to keep visuals consistent.

## File Structure

```
Checkbox/
├── ARCHITECTURE.md
├── Checkbox.component.tsx
├── Checkbox.stylex.ts
├── Checkbox.types.ts
└── index.ts
```

## Props

| Prop         | Type                                   | Description                                |
| ------------ | -------------------------------------- | ------------------------------------------ |
| `isChecked`  | `boolean`                              | Controlled checked state                   |
| `isDisabled` | `boolean`                              | Disables input and applies disabled cursor |
| `isReadOnly` | `boolean`                              | Sets native input read-only                |
| `onChange`   | `ChangeEventHandler<HTMLInputElement>` | Native checkbox change callback            |
| `dataTestId` | `string`                               | Applied to icon overlay for test targeting |

## Render Structure

- Root wrapper `span` (`position: relative`)
- Native `input[type=checkbox]` for semantics and interaction
- Conditional overlay `CheckIcon` when checked
