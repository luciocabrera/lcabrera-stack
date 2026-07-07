# TableRowActionsMenu Architecture

Row-level actions menu rendered in the table `actions` column using the native
Popover API.

## Responsibility

- Render view/edit/delete actions according to the `crud` feature flags.
- Resolve row ids through `resolveCrudRowId` from the column(s) marked `isPrimaryKey`.
- Perform delete with a confirmation prompt and React Router `useFetcher().submit()` to `metaState.deleteActionPath`.
- Append custom action-column content after built-in CRUD menu entries.
- Compute popover coordinates through pure util logic and apply coordinates via StyleX dynamic styles.
- Render menu actions only while `isMenuOpen` is true to keep menu subtree lifecycle aligned with popover visibility.

## File Structure

```
TableRowActionsMenu/
├── TableActionMenu/
│   ├── TableActionMenu.component.tsx              → Extracted view/edit/delete/custom-actions renderer
│   ├── TableActionMenu.types.ts                   → Local props contract
│   └── index.ts                                   → Local barrel
├── TableRowActionsMenu.component.tsx   → Menu trigger + popover panel + CRUD item wiring
├── TableRowActionsMenu.stylex.ts       → Trigger/menu/item styles
├── TableRowActionsMenu.types.ts        → Props contract
├── utils/
│   ├── getTableRowActionsMenuPosition.util.ts       → Pure coordinate computation (no side effects)
│   └── getTableRowActionsMenuPosition.util.test.ts  → Unit coverage for positioning behavior
├── ARCHITECTURE.md                     → This file
└── index.ts                            → Barrel export
```

## Render Flow

```mermaid
graph TD
  Menu["TableRowActionsMenu"] --> Trigger["TableActionButton"]
  Menu --> Popover["div popover"]
  Popover --> OpenCheck{"isMenuOpen?"}
  OpenCheck -->|yes| ActionMenu["TableActionMenu"]
  ActionMenu --> BuiltIn["view/edit/delete (enabled only)"]
  ActionMenu --> Custom["customActions (optional, appended)"]
  BuiltIn --> Delete["confirm() -> fetcher.submit(intent=delete,id)"]
```

## Delete Contract

- Requires `crud.deleteActionPath`.
- Uses `method='post'` with form data payload: `intent=delete`, `id=<resolved row id>`.
- Confirmation text uses `titleSingular` when available for a user-facing prompt.
