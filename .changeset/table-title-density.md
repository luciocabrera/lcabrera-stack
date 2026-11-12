---
'@lcabrera/ui': minor
---

The title bar above a `Table` gets a density level of its own. `titleDensity`
on `Table` sets it, and a table resolves it the same way it resolves
`headerDensity`: its own setting, the prop, the Global Settings default, then
the row level.

**A table whose rows are not `compact` now gets a matching title bar.** A
`dense` table's title bar is shorter than before and a `spacious` one's is
taller. A `compact` table, the default, looks the same. To keep the old title
bar on a table with a different row level, pass `titleDensity='compact'`.

`Title` gains `size` (`'sm'`, `'md'`, `'lg'` or `'xl'`, default `'md'`), which
sets the `toolbar` variant's padding and title size. `'md'` is the size it had
before. The `plain` variant ignores it. `TitleSize` is exported.

The table settings panel's Display tab and the Settings page's Table Display tab
group the three levels under one **Density** heading as Rows, Column headers and
Title bar, replacing the "Row Density" and "Header Density" labels. The panel
leaves out Title bar when the table has no title bar. Column header levels are
now described by height ("24px tall"), and title bar levels by name only. The
title bar level is persisted in the UI-flags cookie beside the other two, and
`GlobalTableDisplayPreferences` gains `titleDensity`.
