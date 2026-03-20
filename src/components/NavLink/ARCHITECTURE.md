# NavLink Architecture

Design-system–styled wrapper around React Router's `NavLink` that applies active/inactive styles, design token variants (color, size, orientation, width), and an optional leading icon.

## File Structure

```
NavLink/
├── index.ts                       → Barrel export
├── NavLink.component.tsx          → RouterNavLink wrapper
├── NavLink.types.ts               → NavLinkProps (extends RouterNavLinkProps)
├── NavLink.stylex.ts              → linkItemStyles (delegates to design-system tokens)
└── utils/
    ├── index.ts                   → Barrel export
    └── getClassName.util.ts       → Resolves StyleX class string for className prop
```

## Dependencies

```mermaid
graph LR
  NavLink --> RouterNavLink["NavLink (react-router)"]
  NavLink --> NavLink_stylex["NavLink.stylex (linkItemStyles)"]
  NavLink --> getClassName["utils/getClassName"]

  NavLink_stylex --> baseInteractiveStyles["design-system/tokens/commons.stylex (baseInteractiveStyles)"]
  NavLink_stylex --> colorVariants["colorVariants"]
  NavLink_stylex --> orientationVariants["orientationVariants"]
  NavLink_stylex --> rippleBase["rippleBase"]
  NavLink_stylex --> sizeVariants["sizeVariants"]
  NavLink_stylex --> widthVariants["widthVariants"]
  NavLink_stylex --> colors["design-system/tokens/colors.stylex"]

  getClassName --> stylex_props["stylex.props() → .className string"]
  getClassName --> design_types["types/design-system.types"]
```

## Render Flow

```mermaid
graph TD
  NavLink --> RouterNavLink2["RouterNavLink (prefetch, ...props)"]
  RouterNavLink2 -->|"className callback"| getClassNameCall["getClassName({ color, isActive, orientation, size, styles, width })"]
  getClassNameCall --> classString["CSS class string"]
  RouterNavLink2 --> IconSlot{"icon prop?"}
  IconSlot -->|yes| IconSpan["span.icon → icon"]
  IconSlot -->|no| skip["(omitted)"]
  RouterNavLink2 --> LabelSpan["span.label → children"]
```

## `getClassName` Utility

React Router's `NavLink` accepts a `className` function `({ isActive }) => string`. `getClassName` calls `stylex.props(...)` and returns the resulting `.className` string, applying variant tokens in order:

```
base → orientation[x] → size[x] → color[x] → width[x] → [active]
```

The `active` style (`backgroundColor: brandPrimary, color: brandPrimaryText, fontWeight: 600`) is conditionally appended when `isActive === true`.

## Style Token Variants

| Prop          | Type                      | Default      | Token source          |
| ------------- | ------------------------- | ------------ | --------------------- |
| `color`       | `DesignSystemColor`       | `'ghost'`    | `colorVariants`       |
| `size`        | `DesignSystemSize`        | `'md'`       | `sizeVariants`        |
| `orientation` | `DesignSystemOrientation` | `'vertical'` | `orientationVariants` |
| `width`       | `DesignSystemWidth`       | `'full'`     | `widthVariants`       |

## Props

Extends `RouterNavLinkProps` (all React Router `NavLink` props forwarded), with `children` overridden to `ReactNode`.

| Prop          | Type                                           | Default      | Description                               |
| ------------- | ---------------------------------------------- | ------------ | ----------------------------------------- |
| `children`    | `ReactNode`                                    | —            | Link label text or element                |
| `color`       | `DesignSystemColor`                            | `'ghost'`    | Visual color variant                      |
| `icon`        | `ReactNode`                                    | —            | Optional leading icon                     |
| `orientation` | `DesignSystemOrientation`                      | `'vertical'` | Layout axis (`'horizontal'` for toolbars) |
| `prefetch`    | `'none' \| 'intent' \| 'render' \| 'viewport'` | `'none'`     | React Router prefetch strategy            |
| `size`        | `DesignSystemSize`                             | `'md'`       | Height / padding variant                  |
| `width`       | `DesignSystemWidth`                            | `'full'`     | `'full'` stretches to container width     |

## Active State

React Router resolves `isActive` based on whether the current URL matches the `to` prop (supports relative paths, `end` prop, and `caseSensitive`). The `active` style overrides color and background with brand tokens.

## Container Naming

`linkItemStyles.base` includes `containerName: 'toolbarLink'` — allows parent CSS Container Queries to target NavLink items inside toolbar/nav containers.
