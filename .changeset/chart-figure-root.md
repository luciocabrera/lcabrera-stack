---
'@lcabrera/ui': patch
---

`Heatmap` and `LineChart` render their root as a `<figure>` named through `aria-labelledby` by the title the plot already draws, so a chart, its axis labels, its legend and its links sit inside one named figure. No new id is generated: the figure points at the same `<title>` id the plot or grid uses. The root keeps its layout, with the figure's default margin reset to zero.
