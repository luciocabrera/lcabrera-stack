---
'@lcabrera/ui': minor
---

The staged aggregates in the settings drawer's Grouping tab can now be dragged
into any order.

Each measure gets a drag handle, the same one the Group Keys, Sort and Column
Order lists have carried all along — the aggregate list was the only staged list
in the drawer a user could not reorder. The drag stages like every other edit in
that drawer: nothing navigates until Accept, and Accept still costs a single
navigation however many edits were staged. Cancel discards a reorder along with
the rest.

The order is real state, not a view preference. It rides in the `grouping`
search param's `agg` array, so a reordered list survives a shared link and a
reload — including a move that takes one column's measure above another's, which
is the case the ordered wire format exists for.

The order a reorder produces is a **permutation** of what was applied: dragging
can neither introduce an aggregate nor drop one. That matters for a consumer
seeding the grouping store from a hand-written loader, where an aggregate on a
column the route does not declare is staged but not rendered — such an entry
keeps its place rather than being silently un-staged by someone dragging a row
they can see.

Each row keeps its share toggle and its remove control, and two measures on one
column still remove independently: a row is identified by its `(columnKey, fn)`
pair, which is also what the reorder names.
