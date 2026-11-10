---
'@lcabrera/ui': minor
---

`TrendSparkline` takes an optional `emptyRole`, `'group'` or `'img'`. A chart
with nothing to draw used to leave the accessibility tree; with `emptyRole` set
it keeps that role, named by its `label`, so a row of charts announces every
chart even when one series has no points. Unset, an empty chart is hidden as
before.
