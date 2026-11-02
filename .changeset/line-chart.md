---
'@lcabrera/ui': minor
---

Add `LineChart`, exported from the package root and from
`@lcabrera/ui/components/LineChart`. It draws one or more series of
`{ x, y }` points, where `x` is a number or a `Date` and a `null` `y` leaves a
gap the line does not bridge. A series can carry a `band` of `lower` and
`upper` bounds, shaded behind its line; the chart computes no statistic, so the
bounds are the caller's. `isDashed` dashes a series and `tone` colours it, and
a series without a tone takes the next palette tone. `markers` draw a dashed
vertical line at an `x`, labelled above the plot and linked when the marker has
`to`.

`xAxis` and `yAxis` take a `label`, a `domain`, `ticks` and a `format`; without
them the domain spans every point, band and marker and the ticks are nice
values, on whole UTC days for a date axis that spans a day or more. `points`
chooses which points get a dot: `auto` draws a linked point, a toned point, or
every point of a short series; `always` draws every point; `never` draws only
the linked ones, so a link is always reachable. A linked dot is a router `Link`
named by the point's `label`, or by its series and formatted values. A series
longer than the plot is wide is thinned with largest-triangle-three-buckets.

The chart is a single SVG with a `viewBox` and `preserveAspectRatio="none"`,
with non-scaling strokes and its text in HTML placed by percentage, so it
measures nothing and renders the same markup on the server and the client.
It is `role="img"`, named by `title` and described by `description`, or
`role="group"` when it holds a link. More than one series adds a legend, and
`hasDataTable` adds a visually hidden table of every point. Colours come from
the theme tokens.
