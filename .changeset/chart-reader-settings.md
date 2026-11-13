---
'@lcabrera/ui': minor
---

`Heatmap`, `LineChart` and `TrendSparkline` take reader settings, the way `Table` does: a settings button opens a side panel, and Accept applies what the reader staged. The settings last for the life of the chart; nothing is persisted.

Each chart offers only the settings it can draw:

- `Heatmap`: density (cell size), column labels (every label, every 2nd or every 5th), the legend, and the data table shown as a visible table.
- `LineChart`: density (plot height), points (`auto`, every point, or linked points only), axis ticks on a numeric axis, the legend past one series, marker labels when there are markers, and the visible data table.
- `TrendSparkline`: density (height), and the line between points on a points chart.

New props on all three: `density` sets the level the chart opens at, using the four `Table` levels (`dense`, `compact`, `comfortable`, `spacious`), and `features={{ settings: false }}` draws the chart without the button. `cellSize` and `height` now give the size at `compact`, which is the default level, so a chart that sets neither prop renders at the size it did before. The new types `ChartDensity` and `ChartFeatures` are exported from the package root.

**This is the breaking part:** settings are on by default, so every chart now draws a settings button: above a `Heatmap` or `LineChart`, beside a `TrendSparkline`. Pass `features={{ settings: false }}` where a chart sits inside another component, such as a table cell, to keep the previous output.

With settings on, the props behind a setting are read once, on the first render, to seed what the panel opens with: `density` on all three; `points` and `hasMarkerLabels` on `LineChart`; `isConnected` on `TrendSparkline`. A later change to one of them does not reach the chart, because the reader's choice stands for the life of the chart. A chart you drive from your own state should pass `features={{ settings: false }}`, which applies its props on every render. The panel also decides which settings to offer from the first render: a `LineChart` first drawn with no markers offers no marker-labels switch, and markers added later are labelled as `hasMarkerLabels` asks.
