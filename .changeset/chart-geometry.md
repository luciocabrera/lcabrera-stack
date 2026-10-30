---
'@lcabrera/utils': minor
---

Add chart geometry under `@lcabrera/utils/chart/*`, one subpath per helper.
`scaleLinear` and `scaleTime` map a number or `Date` domain onto a pixel range
and can clamp to it; a domain of a single value maps every value to the middle
of the range. `niceTicks` picks axis ticks at one, two, five or ten times a
power of ten, exact at small and large scales alike. `linePath` and `bandPath`
return SVG path data, breaking the path at a value that is missing, `null` or
not finite. `decimate` thins a long series with largest-triangle-three-buckets
and keeps the first and last points. `formatPathPoint` writes the rounded `x,y`
pairs both paths use. Every helper is pure and reads no DOM.
