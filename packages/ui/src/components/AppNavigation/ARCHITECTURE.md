# AppNavigation Architecture

Application-owned sidebar navigation shell. It composes existing design-system
components rather than introducing a second navigation primitive.

## File Structure

```
AppNavigation/
├── index.ts                         → Barrel export
├── AppNavigation.component.tsx      → Shell: pin/open state + SidePanel composing header/body/footer
├── AppNavigation.constants.ts       → NAV_DENSITY size-preference map
├── AppNavigation.stylex.ts          → Shared layout StyleX styles (consumed by subcomponents + utils)
├── AppNavigation.types.ts           → Props and local variant types
├── AppNavigation.test.tsx           → Integration tests (real GlobalSettingsProvider)
│
├── NavigationHeader/                → Brand + expand/pin/close actions placement
│   ├── NavigationHeader.component.tsx
│   ├── NavigationHeader.types.ts
│   └── NavigationHeader.test.tsx
│
├── NavigationBody/                  → Vertical toolbar of app-supplied route links
│   ├── NavigationBody.component.tsx
│   ├── NavigationBody.types.ts
│   └── NavigationBody.test.tsx
│
├── NavigationFooter/                → Theme toggle button
│   ├── NavigationFooter.component.tsx
│   ├── NavigationFooter.types.ts
│   └── NavigationFooter.test.tsx
│
├── NavigationHeaderActions/         → Expand/collapse, pin, close control buttons
├── NavigationLauncher/              → Floating open button when unpinned
├── utils/                           → Density styles, pin resolution, labels (individually tested)
└── ARCHITECTURE.md                  → This document
```

## Dependencies

```mermaid
graph LR
  AppNavigation --> SidePanel
  AppNavigation --> NavHeader["NavigationHeader"]
  AppNavigation --> NavBody["NavigationBody"]
  AppNavigation --> NavFooter["NavigationFooter"]
  AppNavigation --> NavLauncher["NavigationLauncher"]
  AppNavigation --> GlobalSettingsSelectors

  NavHeader --> Icons
  NavHeader --> NavHeaderActions["NavigationHeaderActions"]
  NavHeader --> GlobalSettingsSelectors
  NavHeader --> GlobalSettingsActions

  NavBody --> Toolbar
  NavBody --> GlobalSettingsSelectors

  NavFooter --> Button
  NavFooter --> GlobalSettingsSelectors

  ConsumingApp -. "getNavigationItems prop" .-> AppNavigation
```

Each subcomponent reads the collapsed/size preferences it needs directly from
`GlobalSettingsContext` selectors; the parent only passes what it owns —
`isPinned` (derived from the `defaultIsPinned` prop + preference) and the
off-canvas `onClose` handler, plus the pass-through consumer props
(`getNavigationItems`, `isDarkMode`, `onToggleTheme`).

## Render Flow

```mermaid
graph TD
  A[AppNavigation] --> B{isPinned}
  B -->|yes| C[Render SidePanel as pinned aside]
  B -->|no| D[Render compact launcher rail with open button]
  D --> E{isOpen}
  E -->|yes| F[Render SidePanel as left dialog]
  A --> P[Read global collapsed and pinned preferences from GlobalSettingsContext]
  P --> Q[Initialize and sync local isExpanded and isPinned state]
  A --> M[Read global navigation size preference from GlobalSettingsContext]
  M --> N[Map preference to SidePanel size: compact→rail, small→xs, medium→sm, large→md]
  M --> O[Resolve compact visuals when preference is compact]
  C --> G[Header controls: pin]
  F --> H[Header controls: pin, close]
  G --> I[Toolbar renders route links]
  H --> I
  I --> J{compact mode?}
  J -->|yes| K[Square centered icon controls with right-side tooltips]
  J -->|no| L[Full-width labelled controls]
```

## Props

| Prop                 | Type                                                 | Default | Description                                             |
| -------------------- | ---------------------------------------------------- | ------- | ------------------------------------------------------- |
| `defaultIsPinned`    | `boolean`                                            | `true`  | Initial pinned/unpinned sidebar state                   |
| `getNavigationItems` | `(iconSize: number) => readonly ToolbarItemConfig[]` | —       | Returns this app's own route links, sized to `iconSize` |

## Route Items

`AppNavigation` is app-agnostic — it has no opinion on what routes exist.
Each consuming app supplies its own `getNavigationItems` function (e.g.
`apps/react-router/src/root/getNavigationItems.util.tsx`), passed down
through `AppShell`'s own `getNavigationItems` prop. Every returned item is
typed `ToolbarItemConfig` and rendered through the existing `Toolbar`/
`NavLink` contracts. This function previously lived inside this package
(`utils/getNavigationItems.util.tsx`) with `apps/react-router`'s routes
hardcoded into it — moved out because a shared package should not encode
one specific consuming app's route list.

## Compact Mode

Compact mode is controlled by the global navigation size preference. When set to
`compact`, `AppNavigation` uses `SidePanel` rail width, passes `isCompact` to
`Toolbar`, and renders icon-only controls with tooltips.

## Initial Pin and Expansion State

`AppNavigation` derives initial and hydrated runtime state from global
navigation preferences:

- `collapsed: 'collapsed'` starts the panel collapsed (`isExpanded = false`).
- `pinned: 'unpinned'` starts the panel as unpinned (`isPinned = false`) and open (`isOpen = true`).
- Missing values fall back to defaults (`expanded`, and `defaultIsPinned`).

The component also synchronizes `isExpanded` and `isPinned` when global
preferences change (for example, after accepting changes in Settings).

Header actions are also write-through:

- Expand/collapse persists `navigation.collapsed` immediately.
- Pin/unpin persists `navigation.pinned` immediately.
