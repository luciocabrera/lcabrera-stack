---
governs:
  - ui
---

# ADR-150 — Charts take reader settings the way the Table does

**Status:** Accepted

**Date:** 2026-11-12

**Relates to:** [ADR-148](ADR-148-table-density-falls-back-from-the-table-to-its-prop-to-the-global-default.md), [ADR-146](ADR-146-build-application-ui-from-the-component-library.md)

## Context

`Table` lets the person reading it change how it looks: a settings button
opens a side panel, the reader stages changes, and Accept applies them. The
three charts in `@lcabrera/ui` (`Heatmap`, `LineChart`, `TrendSparkline`) let
the reader change nothing. Every size and display choice (`cellSize`,
`height`, `points`, `hasMarkerLabels`, `hasDataTable`) was a prop only the
developer sets.

A consumer that wanted a density control had to build it next to the chart,
mapping its own levels onto `cellSize` or `height`. Every consumer that wanted
one would write the same control again, and each would pick different levels
from the four the `Table` already uses.

## Options considered

1. **Leave the controls to the consumer.** The status quo. Each consumer
   rebuilds the same picker with its own levels. Rejected.
2. **An inline toolbar above each chart, applied at once.** Smaller, but a
   second settings pattern beside the `Table`'s drawer, and it has no room for
   more than two or three controls. Rejected.
3. **A settings button and side panel, staged and applied on Accept, as the
   `Table` does.** One pattern for every component a reader can adjust. Chosen.

## Decision

Each chart wraps its drawing in `ChartSettings`
(`packages/ui/src/components/ChartSettings/`), which owns a store, per the
store pattern, holding the applied settings, the draft the panel is editing,
and whether the panel is open and pinned. The chart's props seed the store
once; after that the reader's choices win for the life of the chart. Nothing is
persisted.

The panel shows only the settings a chart seeded: a field left `undefined` is
a setting that chart does not offer, so one panel body serves all three
charts. Density uses the `Table`'s four levels, and a chart's `cellSize` or
`height` is the size at `compact`, which is the default, so a chart that sets
neither renders as it did before.

Settings are on by default. `features={{ settings: false }}`, the spelling
`Table` uses for the same switch, draws the chart straight from its props with
no button and no store. A chart inside another component, such as a table cell,
turns it off.

## Consequences

Every chart a consumer already renders now draws a settings button, which is a
visible change on upgrade. Charts inside table cells or summary cards have to
pass `features={{ settings: false }}` to look as they did.

Because the props only seed the store, a prop that changes after the first
render does not reach a chart whose settings are on. That is what lets the
reader's choice stand, and it is also a trap: a developer who drives `density`
from their own state will see it ignored. With settings off, the props apply on
every render.

The chart's figure is now a separate component that takes the resolved
settings, so a test that queries a chart's whole container meets the button's
icon too. The charts' own tests render with settings off to keep testing the
figure alone; separate `*.settings.test.tsx` files cover the panel.

## References

- The Table's drawer: `packages/ui/src/components/Table/TableSettingsDrawer/`
- Requirement: `docs/product/requirements/shape-a-chart-while-i-read-it.md`
