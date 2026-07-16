# Button Component Architecture

## File Structure

```
Button/
├── index.ts                         → Barrel export: { Button } + type { ButtonProps }
├── Button.component.tsx             → Thin component: builds the button, wraps in Tooltip
├── Button.types.ts                  → ButtonProps (extends native <button>) + ButtonElementArgs
├── Button.stylex.ts                 → Style composition from shared design tokens
└── utils/
    ├── getButtonElement.util.tsx    → Pure helper returning the native <button> element
    └── getButtonElement.util.test.tsx
```

`Button.component.tsx` stays slim: it peels off the tooltip concerns and calls
`getButtonElement` to build the `<button>`. The helper **returns a host
`<button>` element** (not a component) on purpose — `Tooltip`'s trigger detects
a natively interactive child by inspecting the immediate element type
(`getIsNativeInteractiveElement`), and a component boundary would hide the
`<button>` and make the trigger wrongly add a redundant `role="button"`.

## Dependencies

```mermaid
graph LR
  Button --> Button.types
  Button --> getButtonElement
  Button --> Tooltip

  getButtonElement --> Button.stylex
  getButtonElement --> Button.types

  Button.types -.-> design-system.types

  Button.stylex --> commons.stylex
  Button.stylex --> base.stylex
```

## Render Flow

```mermaid
graph TD
  A[Destructure tooltip props with defaults] --> B[getButtonElement builds the button]
  B --> C{icon prop?}
  C -- Yes --> D[Add icon span]
  C -- No --> E[Skip icon]
  D --> F[Add children label span; hide from layout when icon-only]
  E --> F
  F --> G[Apply StyleX styles → return host button element]
  G --> H{tooltipContent?}
  H -- Yes --> I[Wrap button in Tooltip]
  H -- No --> J[Return button]
  I --> J
```

## Props

`ButtonProps` extends `ComponentPropsWithoutRef<'button'>` plus:

| Prop               | Type                             | Default      |
| ------------------ | -------------------------------- | ------------ |
| `color`            | `DesignSystemColor`              | `'primary'`  |
| `customStylex`     | `StyleXStyles`                   | —            |
| `icon`             | `ReactNode`                      | —            |
| `isBusy`           | `boolean`                        | `false`      |
| `isIconOnly`       | `boolean`                        | `false`      |
| `isDisabled`       | `boolean`                        | `false`      |
| `orientation`      | `DesignSystemOrientation`        | `'vertical'` |
| `size`             | `DesignSystemSize`               | `'md'`       |
| `tooltipContent`   | `ReactNode`                      | —            |
| `tooltipPlacement` | `top \| bottom \| left \| right` | `'top'`      |
| `variant`          | `DesignSystemStyle`              | `'solid'`    |

### Design System Enums

| Type                      | Values                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `DesignSystemColor`       | `primary`, `secondary`, `success`, `warning`, `error`, `ghost`, `outline`, `danger-ghost` |
| `DesignSystemSize`        | `mini`, `sm`, `md`, `lg`, `embedded`                                                      |
| `DesignSystemStyle`       | `solid`, `flat`, `elevated`                                                               |
| `DesignSystemOrientation` | `horizontal`, `vertical`                                                                  |

## Style Composition

`buttonStyles` in `Button.stylex.ts` is a composed object. Most styles come from shared
design tokens in `commons.stylex`; only button-specific overrides are defined locally.

```mermaid
graph LR
  subgraph "buttonStyles"
    bs_base["base"]
    bs_color["color"]
    bs_icon["icon"]
    bs_label["label"]
    bs_orientation["orientation"]
    bs_size["size"]
    bs_style["style"]
  end

  subgraph "commons.stylex (shared)"
    baseInteractiveStyles
    colorVariants
    orientationVariants
    sizeVariants
    rippleBase
  end

  subgraph "Button.stylex.ts (local)"
    buttonSpecificStyles
    styleVariants
  end

  bs_base --- baseInteractiveStyles
  bs_base --- buttonSpecificStyles
  bs_base --- rippleBase
  bs_color --- colorVariants
  bs_icon --- baseInteractiveStyles
  bs_label --- baseInteractiveStyles
  bs_orientation --- orientationVariants
  bs_size --- sizeVariants
  bs_style --- styleVariants
```

**Local-only styles** (`buttonSpecificStyles`):

- `cursor: pointer` (default) / `not-allowed` (disabled)
- `iconOnly`: removes the gap and centers icon content
- `labelHidden`: removes label text from visual layout for icon-only controls
- `opacity: 0.6` (disabled)
- `containerName: 'button'`

**Local-only variants** (`styleVariants`):

- `elevated` → `boxShadow: shadows.md`
- `flat` → `boxShadow: shadows.none`
- `solid` → `boxShadow: shadows.sm`

## Consumers

Used across **15+ components** including Modal, Table, Tag, Toolbar, VirtualList,
PinSideModal, and route-level components.
