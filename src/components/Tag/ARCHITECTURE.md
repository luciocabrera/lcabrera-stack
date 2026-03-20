# Tag Component Architecture

Small removable label component composed from a styled container, text label,
and an embedded ghost Button with a close icon.

## File Structure

```
Tag/
├── ARCHITECTURE.md         -> This documentation
├── index.ts                -> Barrel export: Tag + TagProps
├── Tag.component.tsx       -> Component render and remove interaction
├── Tag.stylex.ts           -> Container and label styles
└── Tag.types.ts            -> TagProps
```

## Dependencies

```mermaid
graph LR
  Tag[Tag component] --> Types[Tag types]
  Tag --> Styles[Tag styles]
  Tag --> Button[Button component]
  Tag --> Icons[Menu close icon]
  Tag --> IconSize[Extra small icon size constant]

  Styles --> BaseTokens[Base design tokens]
  Styles --> ColorTokens[Color tokens]
```

## Public API

`TagProps`:

| Prop       | Type         | Description                              |
| ---------- | ------------ | ---------------------------------------- |
| `label`    | `string`     | Visible tag text                         |
| `onRemove` | `() => void` | Called when the remove button is clicked |

## Render Structure

```mermaid
graph TD
  Root[Tag root span]
  Label[Label span]
  RemoveButton[Embedded Button]
  CloseIcon[Close icon]

  Root --> Label
  Root --> RemoveButton
  RemoveButton --> CloseIcon
```

## Render Flow

```mermaid
graph TD
  A[Read label and onRemove props] --> B[Render outer span with tag styles]
  B --> C[Render label span]
  C --> D[Render embedded ghost Button]
  D --> E[Render close icon]
  E --> F[Attach click handler]
  F --> G[Stop event propagation]
  G --> H[Call onRemove]
```

## Interaction Model

The remove button click handler performs two steps:

1. Stops event propagation.
2. Calls `onRemove`.

This prevents parent click handlers from firing when the user removes a tag.

```mermaid
sequenceDiagram
  participant U as User
  participant B as Remove button
  participant T as Tag
  participant P as Parent container

  U->>B: click
  B->>T: inline click handler
  T->>T: stopPropagation
  T->>T: onRemove
  Note over P: Parent click handlers do not receive the event
```

## Style Composition

`Tag.stylex.ts` exposes two style groups:

- `tag`: outer inline-flex container
- `label`: text truncation and typography styles

```mermaid
graph TD
  TagStyles[Tag styles]
  TagStyles --> Container[Container style]
  TagStyles --> Label[Label style]

  Container --> Layout[Inline flex layout]
  Container --> Border[Border and radius]
  Container --> Surface[Secondary surface background]
  Container --> Spacing[Padding gap and min width]

  Label --> Typography[Small text styles]
  Label --> Overflow[Ellipsis and nowrap]
```

### Container behavior

The root tag container:

- uses `display: inline-flex`
- aligns content center
- distributes label and remove button with `space-between`
- preserves compact width with a small `minWidth`
- truncates overflow cleanly

### Label behavior

The label:

- uses small typography tokens
- truncates long values with ellipsis
- keeps a single-line layout via `whiteSpace: nowrap`

## Accessibility and Semantics

- Uses a plain `span` wrapper because the component itself is not interactive.
- Delegates actual interaction and accessibility labeling to the embedded Button.
- The remove button uses `aria-label` in the format `Remove <label>`.

## Design Tradeoffs

- The component is intentionally minimal and stateless.
- It does not own selection, focus, or hover state.
- Removal logic is delegated entirely to the parent through `onRemove`.
- The current implementation uses an inline click handler because it needs access
  to the event object for `stopPropagation` and to call `onRemove` immediately.

## Consumers

Tag is intended for compact removable chips in filtering, selection, and tokenized
input interfaces.
