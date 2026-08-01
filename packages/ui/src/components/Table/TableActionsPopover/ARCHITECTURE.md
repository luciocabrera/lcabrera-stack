# TableActionsPopover Architecture

Shared trigger + popover shell for table "quick actions" menus. Extracted from
`TableRowActionsMenu` so both row-level actions and column-header actions
(`TableHeaderActionsMenu`) reuse the same positioning/trigger/popover-panel
mechanics instead of duplicating them.

## Responsibility

- Render the `TableActionButton` trigger (`MoreVerticalIcon`) with a
  caller-provided `ariaLabel`/`label`.
- Own popover open state and viewport-aware coordinates via the colocated
  `useTableActionsPopoverPosition` hook (RAF-stabilized after opening,
  ResizeObserver/IntersectionObserver-driven while open).
- Render `children` — a render-prop `({ closeMenu }) => ReactNode` — only
  while the popover is open, so callers can close the menu after firing an
  action (e.g. after a row delete or a header sort/pin/hide action).
- Stay content-agnostic: it knows nothing about CRUD, sorting, or pinning —
  callers compose their own menu-item list as `children`.
- Own the menu chrome both callers share: the panel surface, the item/icon
  styles, and `TableActionsPopoverSeparator` for the rule between groups.
- The trigger wrapper defaults to `width: 100%` (fills a dedicated actions-column
  cell, as `TableRowActionsMenu` needs). Callers that render the trigger
  alongside sibling content in a flex row — like `TableHeaderActionsMenu` next
  to the column label — must pass `customStylex` to opt out of the stretch
  (e.g. `width: 'auto'`, `flexShrink: 0`, `marginLeft: 'auto'` to pin it to the
  end of the row instead of overlapping/squeezing the label).

## File Structure

```text
TableActionsPopover/
├── TableActionsPopover.component.tsx      → Trigger + popover panel + render-prop children
├── TableActionsPopover.types.ts           → Props, BoundsRect, MenuPosition, render-prop context type
├── TableActionsPopover.constants.ts       → MENU_* layout constants (gap, nudge, frames, padding)
├── TableActionsPopover.stylex.ts          → trigger/menu/menuItem/menuIcon/menuActions/menuSeparator styles (shared)
├── TableActionsPopoverSeparator/
│   ├── TableActionsPopoverSeparator.component.tsx → Section rule between two groups of items
│   └── TableActionsPopoverSeparator.test.tsx
├── useTableActionsPopoverPosition.hook.ts → State + observers + environment reads (trigger lookup,
│                                            viewport size) injected into the handler-core utils
├── utils/
│   ├── applyRepositionOutcome.util.ts               → Applies a resolveOpenMenuReposition outcome to
│   │                                                  injected close/setPosition callbacks; returns
│   │                                                  whether the menu repositioned (still open)
│   ├── computeMenuPosition.util.ts                  → Measures trigger/cell/menu, delegates to
│   │                                                  getTableActionsPopoverPosition (argument reads only)
│   ├── createViewportRect.util.ts                   → Pure: window dimensions → whole-viewport BoundsRect
│   │                                                  (fallback container bounds, built at reposition time)
│   ├── getIsPopoverOpen.util.ts                     → `:popover-open` check, single-sources the selector
│   ├── getTableActionsPopoverPosition.util.ts       → Pure coordinate computation (no side effects)
│   ├── handlePopoverToggle.util.ts                  → Popover `toggle` event core: syncs open state with
│   │                                                  the Popover API, clears coordinates on close
│   ├── handleToggleMenu.util.ts                     → Trigger-click core: close-if-open, else open via
│   │                                                  Popover API + RAF stabilization loop (environment
│   │                                                  reads injected by the hook)
│   ├── resolveOpenMenuReposition.util.ts            → keep/close/reposition decision core shared by the
│   │                                                  observer and RAF-stabilization paths (argument reads
│   │                                                  only; container rect read lazily on reposition)
│   └── *.util.test.ts                               → Unit coverage per util
├── ARCHITECTURE.md                        → This file
└── index.ts                               → Barrel export
```

## Consumers

- `TableRowActionsMenu` — CRUD view/edit/delete menu for a table row, composes
  `TableActionMenu` as `children`.
- `TableHeaderCell/TableHeaderActionsMenu` — sort/pin/hide/manage menu for a
  column header.

## Render Flow

```mermaid
graph TD
  Caller["Caller (TableRowActionsMenu / TableHeaderActionsMenu)"] --> Popover["TableActionsPopover"]
  Popover --> Hook["useTableActionsPopoverPosition"]
  Popover --> Trigger["TableActionButton (handleToggleMenu)"]
  Popover --> Panel["div popover"]
  Panel --> OpenCheck{"isMenuOpen?"}
  OpenCheck -->|yes| Children["children({ closeMenu })"]
```

## Menu Chrome

**Surface.** The panel composes the shared `surfaceStyles.glassPanel` recipe
ahead of its own frame styles — `stylex.props(surfaceStyles.glassPanel,
styles.menu, …)` — so a menu floating over the grid is the same translucent
material as the settings drawer, which composes the same recipe. `styles.menu`
declares only the frame (border, radius, elevation, padding, `minWidth`) and no
colour of its own; it previously hardcoded an opaque `#0f172a` with an explicit
`backdropFilter: 'none'`, which is what made the menu read as a foreign surface.

**Section rules.** `TableActionsPopoverSeparator` is a standalone flex child of
`menuActions`, not a `border-top` on the first item of the next section. The
container's `gap` then applies equally above and below the rule, so its spacing
is symmetric by construction rather than by two numbers that have to be kept in
agreement — the border-on-item form left 8px above the rule and nothing below
it. It also keeps the rule off the items, whose ghost-button hover background
would otherwise paint right up to it. Callers decide where the boundaries are:
`TableHeaderActionsMenu` renders one between each pair of rendered sections,
`PinAndHideActions` one before "Hide Column", and `TableActionMenu` one before
consumer-supplied `customActions`.
