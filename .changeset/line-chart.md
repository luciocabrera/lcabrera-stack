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

`xAxis` and `yAxis` take a `label`, a `domain`, `ticks` and a `format`. A
`domain` narrower than the data clips the line and band and drops the dots and
links outside it; the data table still lists every point. Without these the domain spans every point, band and marker and the ticks are nice
values. On a date axis the step follows the span, from milliseconds through
hours and days up to months and years, and the default format adds the UTC time
to any date that is not at midnight, so a sub-day axis has distinct labels. `points`
chooses which points get a dot: `auto` draws a linked point, a toned point, or
every point of a short series; `always` draws every point; `never` draws only
the linked ones, so a link is always reachable. A linked dot is a router `Link`
in an HTML list over the plot, named by the point's `label`, or by its series
and formatted values. A point's `tone` is a `ChartTone`. A series
longer than the plot is wide is thinned with largest-triangle-three-buckets.

The chart is a single SVG with a `viewBox` and `preserveAspectRatio="none"`,
with non-scaling strokes and its text in HTML placed by percentage, so it
measures nothing and renders the same markup on the server and the client.
The SVG is `role="img"`, named by `title` and described by `description`,
and holds nothing interactive. More than one series adds a legend, and
`hasDataTable` adds a visually hidden table of every point. Colours come from
the theme tokens.
