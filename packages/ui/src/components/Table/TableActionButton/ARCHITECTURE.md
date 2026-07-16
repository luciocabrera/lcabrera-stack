# TableActionButton Architecture

Icon-only trigger button for row-level table action menus.

## Responsibility

- Render a compact ghost button with the vertical-dots icon.
- Provide a semantic `aria-label` for accessibility.
- Delegate menu behavior to the browser Popover API via `popovertarget` and `popovertargetaction`.

## File Structure

```
TableActionButton/
├── TableActionButton.component.tsx   → Popover trigger button
├── TableActionButton.types.ts        → Public props contract
├── ARCHITECTURE.md                   → This file
└── index.ts                          → Barrel export
```

## Notes

`TableActionButton` is intentionally minimal and stateless so `TableRowActionsMenu`
can control all item composition (CRUD + custom actions) while keeping trigger
UI consistent across table rows.
