# TrendSparkline Architecture

Hand-rolled SVG sparkline — no charting library, consistent with this
repo's StyleX-only, minimal-dependency styling approach. Renders one
`<polyline>` from a chronological array of numbers.

## Public API

- `TrendSparkline` — `values: readonly number[]` (oldest first),
  `tone?: 'error' | 'info' | 'neutral' | 'success' | 'warning'` (default
  `'neutral'`), `width?`/`height?` (default `100`/`24`).

This component has **no opinion on whether a trend is "good" or "bad"** —
same boundary as `StatusBadge`. A rising error count and a rising
"files analyzed" count are both just "the line goes up"; only the
consuming route knows whether that's worth coloring red or green, so
`tone` is caller-supplied.

## Geometry

`utils/getSparklinePoints.util.ts` is the one pure function doing the
actual math — kept separate from the component so it's unit-testable
without rendering: maps `values` onto an SVG `points` string, x evenly
spaced across `width`, y normalized to `[0, height]` and inverted (SVG y
grows downward, so the highest value gets the smallest y). Falls back to a
flat mid-height line for 0-1 values or when every value is identical,
rather than dividing by zero.

## File Structure

- `TrendSparkline.component.tsx` — the `<svg>`/`<polyline>` render
- `TrendSparkline.stylex.ts` — line styles + one stroke-color variant per tone
- `TrendSparkline.types.ts` — `TrendSparklineProps`, `TrendSparklineTone`
- `TrendSparkline.test.tsx` — empty-values and real-geometry cases
- `utils/getSparklinePoints.util.ts` (+ `.test.ts`) — the pure geometry function
- `index.ts` — barrel: component + both types

## Consumer

CQMS's `project-detail` route (Implementation Plan step 8) renders one per
scanner, fed severity counts across that project's recent runs from
`project_scanner_trend`.
