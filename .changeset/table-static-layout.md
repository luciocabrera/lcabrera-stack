---
'@lcabrera/ui': minor
---

`Table` gains a static layout for short read-only tables, feature switches for its chrome, column alignment and width, and a caption and footer.

- `layout='static'` renders every row with no virtualization. The table is as tall as its rows, so it renders inside a parent with no height. It renders `role="table"` with the normal tab order and no roving focus, so a link in a cell is one Tab stop. A row is at least its density's row height and grows to fit a taller cell. A tree of group rows renders flat, every row shown, with nothing that folds. `layout` defaults to `'virtual'`, which is unchanged.
- `features` switches the chrome: `toolbar` (the title bar), `settings` (the settings button and its drawers), `columnMenu` and `resize`. Each unset switch is on in the virtual layout and off in the static one. With all four off, a `Table` that mounts its own providers mounts no filter, global-settings or notification provider.
- A column takes `align` (`'start'`, `'center'` or `'end'`), which wins over the alignment its `dataType` gives and applies to a `render` cell too, and `width`: a starting width in pixels, or `'fill'` for the width the other columns leave. In the static layout a column with no `width` sizes to its content.
- `caption` renders as the table's `<caption>`, and `footer` as one `<tfoot>` row spanning every column, in either layout.
- Fixed: the `<table>` props and `customStylex` a `Table` was given were typed but never reached the rendered `<table>`. They now do, in both layouts, along with a `ref`.

New types: `TableLayoutMode`, `TableFeatures` and `TableColumnAlign`. `isFlexWrapperEnabled` now defaults to off in the static layout.
