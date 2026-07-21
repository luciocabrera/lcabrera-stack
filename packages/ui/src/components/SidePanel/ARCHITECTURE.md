# SidePanel Component Architecture

## File Structure

```
SidePanel/
├── index.ts                          → Barrel export: SidePanel + all sub-components
├── SidePanel.component.tsx           → Root selector: isPinned ? PinnedSidePanel : DialogSidePanel
├── SidePanel.types.ts               → SidePanelProps + variant types
├── SidePanel.stylex.ts               → All root styles (local variants)
│
├── PinnedSidePanel/                  → Private delegate (no barrel): always-visible aside, optional portal, zero effects
│   ├── PinnedSidePanel.component.tsx
│   └── PinnedSidePanel.types.ts      → children, portalContainer?, position, size
│
├── DialogSidePanel/                  → Private delegate (no barrel): native dialog lifecycle + close-event forwarding
│   ├── DialogSidePanel.component.tsx
│   └── DialogSidePanel.types.ts      → children, isOpen, onClose?, position, shouldShowOverlay, size
│
├── SidePanelHeader/                  → Top section with actions slot
│   ├── index.ts
│   ├── SidePanelHeader.component.tsx
│   ├── SidePanelHeader.types.ts     → extends div + actions?: ReactNode
│   └── SidePanelHeader.stylex.ts
│
├── SidePanelHeaderToolbar/           → Reusable pin + close buttons for drawer headers
│   ├── index.ts
│   ├── SidePanelHeaderToolbar.component.tsx
│   └── SidePanelHeaderToolbar.types.ts → isPinned, onClose, onTogglePin
│
├── SidePanelTitle/                   → h2 heading with optional icon
│   ├── index.ts
│   ├── SidePanelTitle.component.tsx
│   ├── SidePanelTitle.types.ts      → extends h2 + icon?: ReactNode
│   └── SidePanelTitle.stylex.ts
│
├── SidePanelBody/                    → Scrollable main content area
│   ├── index.ts
│   ├── SidePanelBody.component.tsx
│   ├── SidePanelBody.types.ts       → extends div
│   └── SidePanelBody.stylex.ts
│
├── SidePanelFooter/                  → Bottom section with top border
│   ├── index.ts
│   ├── SidePanelFooter.component.tsx
│   ├── SidePanelFooter.types.ts     → extends div
│   └── SidePanelFooter.stylex.ts
│
├── SidePanelSection/                 → Section container (uses shared drawerSection tokens)
│   ├── index.ts
│   ├── SidePanelSection.component.tsx
│   ├── SidePanelSection.types.ts    → extends div
│   └── SidePanelSection.stylex.ts
│
├── SidePanelSectionHeader/           → Section header with title + toolbar slot
│   ├── index.ts
│   ├── SidePanelSectionHeader.component.tsx
│   ├── SidePanelSectionHeader.types.ts → extends div + title: string, toolbar?: ReactNode
│   └── SidePanelSectionHeader.stylex.ts
│
├── SidePanelSectionMain/             → Section main content area
│   ├── index.ts
│   ├── SidePanelSectionMain.component.tsx
│   ├── SidePanelSectionMain.types.ts → extends div
│   └── SidePanelSectionMain.stylex.ts
│
└── SidePanelSectionOverlay/          → Blur overlay for inactive sections
    ├── index.ts
    ├── SidePanelSectionOverlay.component.tsx
    ├── SidePanelSectionOverlay.types.ts → children + isOpen: boolean
    └── SidePanelSectionOverlay.stylex.ts
```

## Dependencies

```mermaid
graph LR
  SidePanel --> SidePanel.types
  SidePanel --> PinnedSidePanel
  SidePanel --> DialogSidePanel

  PinnedSidePanel --> SidePanel.stylex
  PinnedSidePanel --> ReactDOM["createPortal (react-dom)"]
  DialogSidePanel --> SidePanel.stylex

  SidePanel.stylex --> base.stylex
  SidePanel.stylex --> colors.stylex

  SidePanelHeaderToolbar --> Button
  SidePanelHeaderToolbar --> Icons["PinIcon / PinOffIcon / MenuCloseIcon"]

  SidePanelHeader --> SidePanelHeader.stylex
  SidePanelHeader.stylex --> base.stylex
  SidePanelHeader.stylex --> colors.stylex

  SidePanelTitle --> SidePanelTitle.stylex
  SidePanelTitle.stylex --> base.stylex
  SidePanelTitle.stylex --> colors.stylex

  SidePanelBody --> SidePanelBody.stylex
  SidePanelBody.stylex --> colors.stylex

  SidePanelFooter --> SidePanelFooter.stylex
  SidePanelFooter.stylex --> base.stylex
  SidePanelFooter.stylex --> colors.stylex

  SidePanelSection --> SidePanelSection.stylex
  SidePanelSection.stylex --> drawerSection.stylex

  SidePanelSectionHeader --> SidePanelSectionHeader.stylex
  SidePanelSectionHeader.stylex --> drawerSection.stylex

  SidePanelSectionMain --> SidePanelSectionMain.stylex
  SidePanelSectionMain.stylex --> drawerSection.stylex

  SidePanelSectionOverlay --> SidePanelSectionOverlay.stylex
  SidePanelSectionOverlay.stylex --> base.stylex
```

## Render Flow

```mermaid
graph TD
  A[Destructure props with defaults] --> D{isPinned?}

  D -- Yes --> E["PinnedSidePanel: aside, open style, no backdrop, pinned"]
  E --> F{portalContainer?}
  F -- Yes --> G[createPortal into container]
  F -- No --> H[Return aside directly]

  D -- No --> I["DialogSidePanel: dialog + panelStyles from isOpen/shouldShowOverlay"]
  I --> J{isOpen?}
  J -- Yes --> K{shouldShowOverlay?}
  K -- Yes --> L["dialog.showModal()"]
  K -- No --> M["dialog.show()"]
  J -- No --> N["dialog.close()"]

  I --> O["Listen for native close event (ESC key)"]
  O --> P["Call onClose callback"]
```

Switching to pinned mode unmounts `DialogSidePanel`; removing the `<dialog>`
from the document closes it natively, so no cross-mode guard effects exist.

## Props

`SidePanelProps` extends `ComponentPropsWithoutRef<'dialog'>` plus:

| Prop                | Type                     | Default   |
| ------------------- | ------------------------ | --------- |
| `children`          | `ReactNode`              | —         |
| `isOpen`            | `boolean`                | —         |
| `isPinned`          | `boolean`                | —         |
| `onClose`           | `() => void`             | —         |
| `portalContainer`   | `RefObject<HTMLElement>` | —         |
| `position`          | `SidePanelPosition`      | `'right'` |
| `shouldShowOverlay` | `boolean`                | `true`    |
| `size`              | `SidePanelSize`          | `'md'`    |

### Variant Enums

| Type                | Values                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `SidePanelPosition` | `left`, `right`                                                       |
| `SidePanelSize`     | `rail` (72px), `xs` (256px), `sm` (320px), `md` (416px), `lg` (512px) |

## Style Composition

All root styles are local in `SidePanel.stylex.ts`. No shared variant objects.

```mermaid
graph LR
  subgraph "sidePanelStyles"
    sp_base["base"]
    sp_pinned["pinned"]
    sp_backdrop["withBackdrop"]
    sp_nobackdrop["withoutBackdrop"]
    sp_content["content"]
    sp_position["position"]
    sp_size["size"]
  end

  subgraph "SidePanel.stylex.ts (local)"
    baseDialog["baseStyles.dialog"]
    pinnedStyle["baseStyles.pinned"]
    backdropStyle["baseStyles.withBackdrop"]
    noBackdropStyle["baseStyles.withoutBackdrop"]
    contentStyle["baseStyles.content"]
    positionVars["positionVariants"]
    sizeVars["sizeVariants"]
  end

  sp_base --- baseDialog
  sp_pinned --- pinnedStyle
  sp_backdrop --- backdropStyle
  sp_nobackdrop --- noBackdropStyle
  sp_content --- contentStyle
  sp_position --- positionVars
  sp_size --- sizeVars
```

**Key behaviors**:

- **Fixed positioning** with `height: 100vh`, slides in/out via `translateX`
- **Pinned mode** switches to `position: relative` with `flexShrink: 0`
- **Native `::backdrop`** styled with overlay color or transparent
- **Container query** enabled: `containerName: 'side-panel'`
- **Rail size** provides a compact pinned navigation panel for consumers that
  rely on icon-only interactive controls.

## Sub-Components

| Component                 | HTML Element | Extra Props                            | Key Styles                                                      |
| ------------------------- | ------------ | -------------------------------------- | --------------------------------------------------------------- |
| `SidePanelHeader`         | `div`        | `actions?: ReactNode`                  | `padding: lg`, bottom border, flex row with actions             |
| `SidePanelHeaderToolbar`  | fragment     | `isPinned`, `onClose`, `onTogglePin`   | No styles — composes Button + Icons                             |
| `SidePanelTitle`          | `h2`         | `icon?: ReactNode`                     | `fontSize: xl`, `fontWeight: semibold`, flex with icon          |
| `SidePanelBody`           | `div`        | —                                      | `flex: 1`, `overflowY: auto`, thin scrollbar                    |
| `SidePanelFooter`         | `div`        | —                                      | `padding: sm`, top border, flex row                             |
| `SidePanelSection`        | `div`        | —                                      | Uses shared `drawerSectionStyles.container`                     |
| `SidePanelSectionHeader`  | `div`        | `title: string`, `toolbar?: ReactNode` | Uses shared `drawerSectionStyles` (headerRow + headerTitle)     |
| `SidePanelSectionMain`    | `div`        | —                                      | Uses shared `drawerSectionStyles.sectionMain`                   |
| `SidePanelSectionOverlay` | `div`        | `isOpen: boolean`                      | Blur overlay (`backdropFilter: blur(4px)`), absolute positioned |

### Intended Composition

```mermaid
graph TD
  SidePanel --> SidePanelHeader
  SidePanel --> SidePanelBody
  SidePanel --> SidePanelFooter

  SidePanelHeader --> SidePanelHeaderToolbar
  SidePanelHeader --> SidePanelTitle

  SidePanelBody --> SidePanelSectionOverlay
  SidePanelSectionOverlay --> SidePanelSection
  SidePanelSection --> SidePanelSectionHeader
  SidePanelSection --> SidePanelSectionMain
```

## Consumers

Used heavily in Table settings drawers:

- `App.tsx` — demo usage with Header/Body/Footer/Title
- `AppNavigation` — left sidebar navigation with compact/full and pin/unpin
  states
- `ColumnSettingsDrawer` — FilterSection, PinningSection, GeneralSection, SortingSection
- `TableSettingsDrawer` — SortingSection, GeneralSettingsSection, AddSortSection, ActiveSortList, ColumnOrderSection
