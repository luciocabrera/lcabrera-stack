---
'@lcabrera/ui': minor
---

Double-clicking a `SidePanel`'s splitter now resets the panel to the width it
opens at, matching the gesture the grid's column splitter already answers.

`SidePanel` takes a new optional `onWidthReset`. It fires on a double-click of
the splitter, and the consumer answers by dropping the width it stored rather
than by writing a number — that is what lets the panel paint from its `size`
variant again. Writing the band's floor instead would park every panel at the
same width whatever size it was opened at, which is why the callback carries no
number to write.

A consumer that passes no `onWidthReset` is unaffected: the handler returns
before touching the event, so a double-click stays an ordinary pair of clicks.

The settings drawers pass it, so a reader who has dragged either one wider can
put it back and it stays put — the cleared width is persisted, not just applied
to the open panel.

**A resize gesture that never moved the pointer now commits nothing.** Both
splitters — the panel's and a grid column's — committed the width they started at
on every mouse-up, so a plain click persisted a value the reader had not changed.
A double-click is two of those, which made the new reset write the old width twice
before dropping it. The end state was always right; the writes were not. Nothing
about a real drag changes.

Resetting from the keyboard is not part of this. The splitter's arrow and
Home/End handling is unchanged, and it has no reset key the way the column
splitter's `Enter` does.
