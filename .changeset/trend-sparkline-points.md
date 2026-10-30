---
'@lcabrera/ui': minor
---

`TrendSparkline` is drawn on the `@lcabrera/utils` chart geometry and gains a
points mode. Pass `points` instead of `values` to draw one dot per point,
coloured from the point's `tone` or else the chart's. A point with `to` renders
as a router `Link` named by its `label`, or by its value when it has none, and
a chart with a linked dot takes the `group` role so the links stay reachable.
Points sit on a scale that starts at zero. A value that is not finite is a
gap: it draws no dot, the line breaks there, and the scale is taken from the
finite values only, in either mode. `max` fixes the top of the scale in
either mode and holds a higher value at the top edge; a `max` that is not above
the bottom of the scale gives a one-unit scale from the bottom in both modes, and on a points chart
`isConnected={false}` leaves the dots unjoined. A chart takes either `values` or `points`:
`TrendSparklineProps` is a union, so passing both, or neither, is a type error,
and so is `isConnected` on a values chart.

A `values` chart draws the same line as before, but as a `<path>` rather than a
`<polyline>`, so a stylesheet that targets `polyline` inside the chart no longer
matches. `TrendSparkline` and its `TrendPoint`, `TrendSparklineProps` and
`TrendSparklineTone` types
are also exported from the package root.
