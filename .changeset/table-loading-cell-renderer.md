---
'@lcabrera/ui': patch
---

A column's `cell` renderer now keeps drawing a row's real value while the table
is loading. It used to be skipped for every row in the loading state, so a
reload with rows already on screen showed the plain default (a badge became
text) and the cell changed shape when loading ended. Placeholder cells, whose
value is empty, still take the default path.
