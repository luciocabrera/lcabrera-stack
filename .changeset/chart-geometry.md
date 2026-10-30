---
'@lcabrera/utils': minor
---

Add chart geometry under `@lcabrera/utils/chart/*`, one subpath per helper.
`scaleLinear` and `scaleTime` map a number or `Date` domain onto a pixel range
and can clamp to it; a domain of a single value maps every value to the middle
of the range. `niceTicks` picks axis ticks at one, two, five or ten times a
power of ten, exact at small and large scales alike. `linePath` and `bandPath`
return SVG path data, breaking the path at a value that is missing, `null` or
not finite. A lone point between two gaps is drawn as a zero-length segment, so
a round line cap shows it as a dot.

`decimate` thins a long series with largest-triangle-three-buckets in linear
time. It takes and returns the same points `linePath` draws. A point whose `x`
or `y` is missing, `null` or not finite is a gap: it passes through unchanged
and does not count against the threshold. Of the finite points, the first and
the last are always kept. `formatPathPoint` writes the rounded `x,y` pairs both
paths use. Every helper is pure and reads no DOM.

Add `isNonEmptyArray` under `@lcabrera/utils/guards/is-non-empty-array.util`, a
guard that narrows an array to a tuple with a first element.
