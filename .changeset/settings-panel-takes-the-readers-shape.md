---
'@lcabrera/ui': minor
---

The settings panel now takes the shape the reader gives it, and a grouped grid
stops painting what it cannot use.

`SidePanel` takes `isResizable`, `width`, `onWidthChange` and `onWidthCommit`: a
splitter on the panel's inner edge, drag and keyboard both, held between 320px
and 90% of the viewport by the gesture and again in CSS — so a width persisted on
a wide display cannot paint off the edge of a narrow one. The change and the
commit are separate calls, so a consumer can hold the live width somewhere cheap
and persist only the settled one. Both table drawers wire that to the UI-flags
cookie.

The settings tabs are ordered by the reader, from a draggable list in the General
tab, and one order governs both drawers: it is stated in roles, so the column
drawer's Pinning tab moves with the table drawer's Columns tab. A stored order
naming an unknown tab, or missing one, degrades to a partial preference rather
than to a missing tab. The declared order is now General, Columns, Filters,
Sorting, Grouping, Details. Totals position moves out of the Grouping tab into
the General tab, where the rest of the panel-wide preferences already sit.

Two changes to a grouped grid, both removing something that could not work:

- **The row-actions column is no longer painted while a grouping is applied.** A
  group row is not a row anything can be done to and a grouped read returns no
  detail row, so the column drew an empty strip down every grouped grid. A
  consumer that relied on it should open a group's rows through the drill-down
  route, which applies no grouping.
- **A grouped grid's columns are sized from one band, and the declared widths no
  longer apply to them.** Flooring a measure at 200 and then clamping it back
  under a source column's `maxWidth` of 180 left the splitter a range of zero, so
  measures could not be resized at all. The band is
  `VITE_TABLE_AGGREGATE_MIN_WIDTH`/`VITE_TABLE_AGGREGATE_MAX_WIDTH`, read from the
  consuming build at build time, defaulting to 200 and 600. A column declared
  narrower than that is no longer narrow while it is grouped.

Also: the tab strip's scroll buttons no longer take focus on a press, which was
putting a focused element inside an `aria-hidden` subtree and printing a console
warning on every click.
