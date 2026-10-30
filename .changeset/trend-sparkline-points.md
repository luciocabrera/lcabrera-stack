---
'@lcabrera/ui': minor
---

`TrendSparkline` is drawn on the `@lcabrera/utils` chart geometry and gains a
points mode. Pass `points` instead of `values` to draw one dot per point,
coloured from the point's `tone` or else the chart's. A point with `to` renders
as a router `Link` named by its `label`, or by its value when it has none, and
a chart with a linked dot takes the `group` role so the links stay reachable.
Points sit on a scale that starts at zero. `max` fixes the top of the scale in
either mode and holds a higher value at the top edge, and `isConnected={false}`
leaves the dots unjoined. A chart takes either `values` or `points`:
`TrendSparklineProps` is a union, so passing both, or neither, is a type error.

A `values` chart draws the same line as before, but as a `<path>` rather than a
`<polyline>`, so a stylesheet that targets `polyline` inside the chart no longer
matches. `TrendSparkline` and its `TrendPoint` and `TrendSparklineProps` types
are also exported from the package root.
