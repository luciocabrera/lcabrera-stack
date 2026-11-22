---
'@lcabrera/ui': minor
---

**Breaking:** `Table` no longer takes `caption`. A table has one title, `title`: it names the `<table>` in both layouts and shows in the title bar when the toolbar is on. Replace `caption='…'` with `title='…'`, and add `features={{ toolbar: true }}` to a static table whose title should be visible.

`Table` renders the same header row in both layouts: the label on one line, cut with an ellipsis, with its column menu beside it. In the static layout the label no longer wraps or sets the column's width: the column takes its width from its cells and its `width`, `minWidth` and `maxWidth`, and is never narrower than the minimum width the virtual layout uses for a column that declares none.

A single-mode `VirtualSelect` keeps a long selected label on one line, cut with an ellipsis, with its chevron beside it. Before, the label took its full text width, pushed the chevron onto a second line and made the trigger taller than the controls next to it.
