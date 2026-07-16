# Title Architecture

Generic title bar with icon, heading (children), and action slots. Purely presentational — no context dependencies.

## File Structure

```
Title/
├── Title.component.tsx   → Conditionally renders icon/heading/actions
├── Title.test.tsx        → Unit tests for empty, title, and slot rendering states
├── Title.types.ts        → TitleProps (actions, customStylex, icon + div props)
├── Title.stylex.ts       → Container, titleSection, icon, actions layout
└── index.ts              → Barrel export
```

## Context Dependencies

None — the heading text comes from `children`.

## Props

| Prop           | Type            | Description            |
| -------------- | --------------- | ---------------------- |
| `children`     | `ReactNode?`    | Heading text (`<h2>`)  |
| `actions`      | `ReactNode?`    | Right-side action slot |
| `icon`         | `ReactNode?`    | Left-side icon slot    |
| `customStylex` | `StyleXStyles?` | Override styles        |

Returns `undefined` (renders nothing) when children, icon, and actions are all empty.
