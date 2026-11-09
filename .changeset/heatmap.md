---
'@lcabrera/ui': minor
---

Add `Heatmap`, exported from the package root and from
`@lcabrera/ui/components/Heatmap`, with the `HeatmapAxisItem`, `HeatmapCell`,
`HeatmapLegendItem`, `HeatmapPattern`, `HeatmapProps` and `HeatmapScale` types.
It draws a value across two dimensions from `rows`, `columns` and a flat array
of `cells` that a loader can return as it is. A position with no cell is drawn
as an empty, dashed outline, and a cell whose row or column is not on an axis is
not drawn.

`scale` is `{ kind: 'tone' }` by default, which fills a cell with its `tone`, or
`{ kind: 'sequential', domain }`, which mixes two colour tokens at the place of
`value` in the domain, clamped to its ends. Under a sequential scale a cell
without a finite `value` falls back to its `tone`. A cell's `pattern` (`hatch` or
`dots`) is painted over its fill, and `legend` lists swatches using the same
patterns; a sequential scale adds a ramp between its two domain values, so colour
is never the only signal. `hasDataTable` adds a visually hidden table of every
position, which holds no links.

The chart is one SVG sized by `cellSize`, with its cells as `rect`s in one group
and each pattern defined once, with ids from `useId`. It reads no size and uses
no effect, so the server and the client render the same markup. With no linked
cell the SVG is `role="img"`, named by `title` and described by `description`. A
cell with `to` hides the SVG from the accessibility tree and lays an HTML
`role="grid"` table over it with the same name and description: that cell holds a
router `Link` named by its `label`, every other cell is named by its `title`, and
the links share one tab stop that moves with the arrow keys, `Home`, `End`,
`PageUp` and `PageDown`, and with `Ctrl` or `Cmd` plus `Home` or `End`, skipping
any cell without a link. A row or column label with `to` is a router `Link` too.
Only a `to` needs a router context.
