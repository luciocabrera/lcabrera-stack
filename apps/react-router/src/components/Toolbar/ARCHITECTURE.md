# Toolbar Component Architecture

Composable navigation and action container that renders a typed list of items as
Buttons or NavLinks, with responsive layout behavior driven by orientation,
container queries, and an optional compact icon-only mode.

## File Structure

```
Toolbar/
├── ARCHITECTURE.md         -> This documentation
├── index.ts                -> Barrel export: Toolbar + Toolbar types
├── README.md               -> Usage guide and examples
├── Toolbar.component.tsx   -> Main orchestration component
├── Toolbar.examples.tsx    -> Example configurations
├── Toolbar.stylex.ts       -> Layout and responsive styles
└── Toolbar.types.ts        -> Item configuration unions and ToolbarProps
```

## Dependencies

```mermaid
graph LR
  Toolbar[Toolbar component] --> Types[Toolbar types]
  Toolbar --> Styles[Toolbar styles]
  Toolbar --> Button[Button component]
  Toolbar --> NavLink[NavLink component]

  Types --> ButtonTypes[Button types]
  Types --> NavLinkTypes[NavLink types]
  Types --> DesignTypes[Design system types]

  Styles --> BaseTokens[Base spacing tokens]
```

## Public API

`ToolbarProps` extends native `nav` props plus:

| Prop          | Type                     | Default    | Description                                           |
| ------------- | ------------------------ | ---------- | ----------------------------------------------------- |
| `isCompact`   | `boolean`                | `false`    | Centers square icon-only controls with label tooltips |
| `items`       | `ToolbarItemConfig[]`    | -          | Ordered list of toolbar items                         |
| `orientation` | `horizontal \| vertical` | `vertical` | Layout direction                                      |
| `size`        | design-system size       | `md`       | Fallback size for items without explicit size         |

### Item Types

`ToolbarItemConfig` is a discriminated union:

- `ToolbarButtonConfig`
- `ToolbarLinkConfig`

#### ToolbarButtonConfig

- Extends Button props except `children` and `width`
- Requires `label`
- Uses `type: 'button'`

#### ToolbarLinkConfig

- Extends NavLink props except `children` and `className`
- Requires `label`
- Uses `type: 'link'`
- Reuses Button color semantics for visual consistency

## Render Structure

```mermaid
graph TD
  Nav[Nav element]
  List[Unordered list]
  Item[Toolbar item list element]
  ButtonNode[Button item]
  LinkNode[NavLink item]

  Nav --> List
  List --> Item
  Item --> ButtonNode
  Item --> LinkNode
```

## Render Flow

```mermaid
graph TD
  A[Read props and defaults] --> B[Render nav element]
  B --> C[Apply toolbar styles based on orientation]
  C --> D[Render unordered list with matching layout styles]
  D --> E[Map items]
  E --> F[Build stable item key from label]
  F --> G[Render list item]
  G --> H{Item type is button}
  H -- yes --> I[Render Button]
  H -- no --> J[Render NavLink]
  I --> K[Pass shared orientation and resolved size]
  J --> K
  K --> L{isCompact?}
L -- yes --> M[Apply square control override and right-side tooltip]
  L -- no --> N[Force full width item content]
```

## Item Rendering Strategy

Toolbar does not render items directly from raw props. Instead, it normalizes a
small shared layout contract and then delegates visual and interactive behavior
to Button or NavLink.

```mermaid
flowchart TD
  A[Toolbar item config] --> B{Type field}
  B -- button --> C[Render Button branch]
  B -- link --> D[Render NavLink branch]

  C --> E[Forward color icon disabled onClick]
  C --> F[Set orientation]
  C --> G[Set size to item size or toolbar size]
  C --> H[Force width full]

  D --> I[Forward color icon end to]
  D --> J[Set orientation]
  D --> K[Set size to item size or toolbar size]
  D --> L[Force width full]
```

### Button branch

For button items, Toolbar forwards:

- `color`
- `icon`
- `isIconOnly=isCompact`
- `isDisabled`
- `onClick`
- `orientation`
- `size`
- `width='full'`
- `customStylex=compactControl` when `isCompact`
- `tooltipContent=label` when `isCompact`
- `tooltipPlacement='right'` when `isCompact`
- button label as `children`

### Link branch

For link items, Toolbar forwards:

- `color`
- `end`
- `icon`
- `isIconOnly=isCompact`
- `orientation`
- `size`
- `to`
- `width='full'`
- `customStylex=compactControl` when `isCompact`
- `tooltipContent=label` when `isCompact`
- `tooltipPlacement='right'` when `isCompact`
- link label as `children`

## Layout Model

Both the outer `nav` and inner `ul` reuse the `toolbar` base style plus an
orientation-specific modifier.

```mermaid
graph TD
  ToolbarStyles[Toolbar styles]
  ToolbarStyles --> Base[Base toolbar style]
  ToolbarStyles --> Horizontal[Horizontal layout style]
  ToolbarStyles --> Vertical[Vertical layout style]
  ToolbarStyles --> Item[Toolbar item style]
  ToolbarStyles --> Responsive[Responsive item style]

  Horizontal --> Wrap[Wrap items]
  Horizontal --> ContainerSwitch[Switch to column below container threshold]
  Vertical --> Column[Always column]
  Responsive --> FullWidth[Grow to full width in narrow horizontal containers]
```

### Base toolbar style

Shared base style defines:

- `display: flex`
- `width: 100%`
- `gap`
- `margin: 0`
- `padding: 0`
- `listStyle: none`
- `containerName: toolbar`
- `containerType: inline-size`

### Orientation behavior

- `vertical`: always column, no wrapping
- `horizontal`: row by default, wrap enabled, switches to column below the
  container query threshold
- `isCompact`: centers items and constrains each control to a 2.5rem square;
  Button/NavLink render as true icon-only controls while `aria-label` and a
  right-side tooltip keep the item name discoverable.

### Item behavior

Each list item uses a flex wrapper. In horizontal mode, `toolbarItemResponsive`
allows items to expand to full width when the toolbar container becomes narrow.

## Accessibility and Semantics

- Uses semantic `nav` as the root container.
- Uses `role='navigation'` explicitly.
- Delegates link/button semantics to NavLink and Button.
- Requires consumers to provide meaningful `aria-label` for navigation purpose.

## Examples and Intended Consumers

`Toolbar.examples.tsx` demonstrates two main use cases:

- vertical navigation for side panels
- horizontal action bars mixing links and buttons

`README.md` acts as the higher-level usage guide, while this document focuses on
internal composition and rendering behavior.

## Design Tradeoffs

- Item keys are currently derived from `label`, so duplicate labels can produce
  unstable or colliding keys.
- Toolbar intentionally stays stateless; routing state, click side effects, and
  active link logic live in child components.
- The new barrel `index.ts` keeps public imports stable, but internal files in
  the same folder may still choose direct relative imports when that is clearer.
