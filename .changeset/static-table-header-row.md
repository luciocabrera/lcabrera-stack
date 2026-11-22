---
'@lcabrera/ui': minor
---

**Breaking:** `Table` no longer takes `caption`. A table has one title, `title`: it names the `<table>` in both layouts and shows in the title bar when the toolbar is on. Replace `caption='…'` with `title='…'`, and add `features={{ toolbar: true }}` to a static table whose title should be visible. The new `titleLevel` prop sets the title bar heading's level (2 unless set), so a table under a section heading can sit one level below it. `caption` took a `ReactNode` and `title` takes a `string`, so a caption holding elements (a badge, a link) becomes its text in `title`, and the elements move outside the `Table`.

`Table` renders the same header row in both layouts: the label on one line, cut with an ellipsis, with its column menu beside it. In the static layout the label no longer wraps or sets the column's width: the column takes its width from its cells and its `width`, `minWidth` and `maxWidth`, and a column that declares no `minWidth` is never narrower than the minimum width the virtual layout uses. In both layouts that default minimum now yields to a smaller declared `maxWidth`: a column with `maxWidth: 40` starts, resizes and pins at 40 instead of being held at the default.

A single-mode `VirtualSelect` keeps a long selected label on one line, cut with an ellipsis, with its chevron beside it. Before, the label took its full text width, pushed the chevron onto a second line and made the trigger taller than the controls next to it.
