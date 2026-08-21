---
'@lcabrera/ui': patch
---

Fixes a crash that emptied a grouped Table to its error boundary — the grid
vanished and the route showed its load-failure state, for data that had loaded
fine.

Three defects composed, and each is fixed on its own terms.

**A drill row's marker never reached the cell that renders it.**
`renderTableBodyPinnedGroup` takes one spread object of per-row fields and
names each one it forwards; `drillRow` was not among them, so it was dropped
silently — an excess property survives a spread rather than being rejected.
Every drill chrome row was therefore read as an ordinary data row, and the
actions column asked it for a primary key it does not carry. That is the crash
on the first click of a chevron.

**A malformed structural row was reclassified as data.**
`getTableGroupRowSummary` and `getTableDrillRow` answer `undefined` both when a
row is not chrome and when its marker is chrome but unreadable, and the render
path could not tell those apart. One member that fails to narrow now blanks the
row instead of turning a group row into a data row. The validators stay strict
— a group described by some of its keys is not the group the row holds — and
`hasTableStructuralMarker` answers the separate question of what the row claims
to be.

The reachable trigger for that one is serialization: an aggregate whose value is
`undefined` loses its `value` key entirely to `JSON.stringify`, and the
presence check that correctly admits `null` then refuses the whole summary.

**Resolving a row id no longer throws during render.** ADR-062 had already drawn
this line for row keys — a throw is right for a CRUD link, where a bad id must
not reach a route, and wrong where the same throw empties the table — and the
row-actions menu, also on the render path, kept the throwing call. It now uses a
non-throwing form and renders no menu for a row with no resolvable id; any
custom actions still render, since they act on the row rather than on an id.
`resolveCrudRowId` is unchanged for callers that want the strict contract.
