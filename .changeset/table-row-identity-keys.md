---
'@lcabrera/ui': patch
---

Table body rows are keyed by data, not by array position.

Every body row was keyed by its index in the data array, so React reused a row's
DOM node for whatever row happened to land at that position after a sort, a
filter or a virtualization scroll. Rows now take their key from the columns
marked `isPrimaryKey`, which is what makes a row's identity survive a reorder —
the prerequisite for stable focus, selection and grouping.

Deriving a key can fail: a table may declare no primary key, or a primary-key
value may not be a scalar. That degrades to an index-derived key rather than
throwing, because a key is needed for every row on every render and a throw on
the render path would empty the whole table. The two kinds of key are prefixed
distinctly, so a row whose primary key is literally the text of some row's index
stays distinguishable from that row.

A table whose columns declare no primary key is unchanged: its rows keep exactly
the positional identity they had.
