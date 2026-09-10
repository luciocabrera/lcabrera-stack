---
'@lcabrera/ui': minor
'@lcabrera/server': minor
---

A grouped read can name a column axis on the grouping envelope. Derived
columns use the emitted alias as the column key and the axis value as the
header; an empty axis emits no measure columns. A malformed axis, or one
that is also a row key, drops the whole grouping payload.
