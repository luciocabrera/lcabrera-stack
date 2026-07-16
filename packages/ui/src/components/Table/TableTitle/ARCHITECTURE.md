# TableTitle Architecture

Optional title bar displayed above the table with icon, heading, and action slots.

## File Structure

```
TableTitle/
├── TableTitle.component.tsx   → Conditionally renders title/icon/actions
├── TableTitle.test.tsx        → Unit tests for empty, title, and slot rendering states
├── TableTitle.types.ts        → TableTitleProps (actions, customStylex, icon)
├── TableTitle.stylex.ts       → Container, titleSection, icon, actions layout
└── index.ts                   → Barrel export
```

## Context Dependencies

| Selector                 | Purpose                          |
| ------------------------ | -------------------------------- |
| `useGetTableTitlePlural` | Table heading text (plural form) |

## Props

| Prop           | Type            | Description            |
| -------------- | --------------- | ---------------------- |
| `actions`      | `ReactNode?`    | Right-side action slot |
| `icon`         | `ReactNode?`    | Left-side icon slot    |
| `customStylex` | `StyleXStyles?` | Override styles        |

Returns `undefined` (renders nothing) when title, icon, and actions are all empty.
