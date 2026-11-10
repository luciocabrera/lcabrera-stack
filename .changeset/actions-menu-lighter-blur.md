---
'@lcabrera/ui': minor
---

Add the `backdropBlur` token group to `design-system/tokens/base.stylex`, with
one entry, `floating` (`blur(10px)`), for small panels that float over content.

The table actions popover, used by the column header and row action menus, now
blurs what is behind it with `backdropBlur.floating` in place of the glass
panel's heavier filter, so the grid stays faintly readable through an open
menu; the panel's fill colour is unchanged. The tooltip moves to the same token,
so its blur goes from 8px to 10px.
