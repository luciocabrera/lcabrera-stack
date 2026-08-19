---
'@lcabrera/ui': minor
---

A grouped table can now drill a leaf group into its own rows.

A group row states how many rows it holds; until now there was no way to see
them without ungrouping the whole table and rebuilding the filters by hand.
Clicking the chevron on a **leaf** group — one whose path names every applied
group key — fetches one bounded page of its rows and splices them underneath it
(ADR-079).

**Wiring it takes two things, and both are deliberate.** The route declares
`isGroupDrillEnabled` on its loader `meta` (ADR-063), and supplies `fetchDrill`
to `TableRouteView`. The flag says the endpoint exists; the fetcher is the call
that reaches it, and it is a prop because a function does not survive the loader
boundary. `useTableRoutePage` composes the query, so a drill inherits the
grouped view's filters and sort by construction — a drilled page read under
different filters returns rows that are individually true and wrong under the
heading above them.

**One page, then a hand-off.** Where a group holds more rows than the page
fetched, the last row states the shortfall and links to the same table
ungrouped, filtered to that group. There is deliberately no second page: the
hand-off exists so nobody has to build in-place paging inside a group.

**A drill can fail, and says so.** A rejection renders a row that names no cause
and names the gesture that retries — closing and reopening the group. Nothing
retries on the user's behalf, which is what keeps a bounded read bounded.

**Accessibility.** A drillable leaf now carries `aria-expanded`, reading `false`
until the group has been opened — it flips when the drill is asked for, not when
the rows land, because the loading and failure rows are themselves content under
it — and responds to `ArrowRight`/`ArrowLeft` like any other tree node. The hand-off is a real link but is **not** a tab stop — the
grid has exactly one (ADR-062) — and is reached with `Enter` on the focused
cell, which now follows any linked cell's link.

The hand-off is withheld where a group key cannot be expressed as a filter, such
as a NULL key: a partial filter selects a larger set than the group, so the link
would open a table showing the wrong rows under the right heading.

`TableGroupDrillFetcher` and `TableGroupDrillRequest` are exported for typing a
route's fetcher. A table that declares no drill behaves exactly as before.
