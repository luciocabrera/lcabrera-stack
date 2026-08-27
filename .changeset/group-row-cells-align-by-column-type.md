---
'@lcabrera/ui': patch
---

Align a group row's cells by their column's data type, as detail rows already
were.

A `currency` or `number` column now renders its group-row content flush right and
a `boolean` or `date` column centred, so a `Sum`, an `Average` and the numbers
beneath them share one edge and can be compared down the column. The em dash on a
column carrying no aggregate, a group key cell, and a detail row's blanked key
column follow the same rule.

Every group-row cell reaches `TableBodyCell` as already-rendered content, and one
flag used to answer both "do not wrap this in the text span" and "do not align
this". The second answer was written for a consumer's own `render()` output and
was being applied to grid-supplied content as well. The two questions are now
separate: `TableBodyCellDescriptor` carries the column's `dataType` on its custom
branch and the cell aligns by it, while a consumer's `render()` output carries
none and is unchanged — no alignment class is applied to it.

Nothing changes for an ungrouped grid.
