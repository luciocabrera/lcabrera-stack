---
'@lcabrera/ui': patch
---

In `Table`'s static layout a header label now wraps onto more lines instead of
being cut off with an ellipsis. A static column sizes to its content, so a
label wider than the column's values used to set the column's width; it now
breaks, and the header row grows to fit, the way a static body row grows with
its cells. The virtual layout still keeps each header label to one line.
