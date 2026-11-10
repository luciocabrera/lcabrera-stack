---
'@lcabrera/ui': minor
---

`Heatmap` and `LineChart` now render their root as a `<figure>` instead of a `<div>`, named through `aria-labelledby` by the title the plot already draws. A chart, its axis labels, its legend and its links now sit inside one named figure, and the accessibility tree gains a `figure` for each chart. Markup that selects the root by element name, snapshots of the rendered output and queries by role will see the change. No new id is generated: the figure points at the same `<title>` id the plot or grid uses. The root keeps its layout, with the figure's default margin reset to zero.
