---
'@lcabrera/ui': patch
---

Table actions menus match the settings drawer's surface, and their section rules
are evenly spaced.

Both menus built on `TableActionsPopover` — the column-header sort/pin/hide menu
and the row-actions menu — rendered on a hardcoded opaque `#0f172a` panel that
explicitly opted out of the glass treatment (`backdropFilter: 'none'`), so a menu
opened next to the settings drawer read as a different material entirely. The
panel now composes `surfaceStyles.glassPanel`, a new recipe holding the blur +
translucent fill that `SidePanel` previously inlined; `SidePanel` composes the
same recipe, so the two cannot drift apart. Its border moves to `borderPrimary`
to match the drawer's chrome.

Section rules were a `border-top` on the first item of the following section,
which left roughly 8px of space above the rule and none below it. They are now
`TableActionsPopoverSeparator` elements — standalone flex children, so the
menu's own `gap` spaces them equally on both sides. Consumers passing
`customActions` to `TableRowActionsMenu` get the same rule above their content
as before, with symmetric spacing.

`SidePanel` renders identically; the recipe extraction is a refactor.
