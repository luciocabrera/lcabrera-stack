---
id: shape-a-chart-while-i-read-it
lines:
  - application
persona: data-user
state: met
packages:
  - ui
requires: []
issues: []
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Heatmap/Heatmap.settings.test.tsx
  - type: test
    ref: packages/ui/src/components/LineChart/LineChart.settings.test.tsx
  - type: test
    ref: packages/ui/src/components/TrendSparkline/TrendSparkline.settings.test.tsx
  - type: doc
    ref: docs/decisions/ADR-150-charts-take-reader-settings-the-way-the-table-does.md
---

# Shape a chart while I read it

## Statement

A chart is drawn at the size and detail its author picked, and that is not
always what I need: a heatmap with many runs is too cramped to read, a line
chart has more ticks than I want, or I would rather read the numbers in a
table. I want to change how a chart looks from the chart itself, the way I
change a table, without asking anyone to change the page.

## Acceptance

- A heatmap, a line chart and a standalone sparkline each draw a settings
  button that opens a side panel, and the panel offers only the settings that
  chart can draw. Decided by `Heatmap.settings.test.tsx` → "offers density,
  column labels, the legend and the data table", `LineChart.settings.test.tsx`
  → "offers density, points, ticks, the legend, the data table and marker
  labels", and `TrendSparkline.settings.test.tsx` → "offers density alone for a
  values chart".
- A change applies on Accept and is dropped on Cancel. Decided by
  `Heatmap.settings.test.tsx` → "resizes the cells to the accepted density" and
  "discards a staged change on Cancel".
- Density resizes the chart: heatmap cells, the line chart's plot and the
  sparkline's height. Decided by `Heatmap.settings.test.tsx` → "resizes the
  cells to the accepted density", `LineChart.settings.test.tsx` → "scales the
  plot height to the accepted density" and `TrendSparkline.settings.test.tsx`
  → "grows to the accepted density and drops the line once it is switched off".
- The data table can be shown as a visible table, and the legend and marker
  labels hidden. Decided by `Heatmap.settings.test.tsx` → "shows the data table
  and hides the legend once accepted" and `LineChart.settings.test.tsx` →
  "hides the legend and the marker labels and shows the data table once
  accepted".
- A chart placed inside another component can be drawn with no button. Decided
  by `Heatmap.settings.test.tsx` → "draws no settings button when the feature is
  off".

## Notes

The `command` pointer was checked against one plant: making Accept close the
panel without applying the draft fails the density case in each of the three
`*.settings.test.tsx` files, and the legend and data-table cases of the heatmap
and the line chart.
