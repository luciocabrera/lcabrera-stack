---
'@lcabrera/ui': minor
---

Adds `isUrlStateReadOnly` to a table's loader `meta`, for a table that renders
inside another table's route.

A child route shares its parent's URL. The table writes its filters and sort
there through `/_action/persist-cookie`, so a second table on that URL
overwrites the first one's — and when the second table _inherited_ those filters
as its starting point, it overwrites its own input. The group-details modal is
the case: it opens over the grouped list, reads the list's filters as the floor
its group was computed under, and must not write back to them.

Declared, a table reads the URL's filter/sort state and keeps its own
adjustments in the store. Absent, a table owns its URL exactly as before, so
nothing changes for an existing route.

What it trades is durability, not capability: the nested table's own sort and
filters last for the life of the dialog, and a refresh returns to the inherited
floor. Anything that must survive a refresh belongs in a param of its own.

It is suppressed in the single place every persistence entry passes through, so
one declaration covers filters, sorting, grouping and the batched settings
write rather than each builder having to remember.

Also adds `groupDetailsPath` to that meta: where the route serves one group's
rows. A path rather than a callback, because a function does not survive the
loader boundary — and a path is all the grid needs, so the innermost key of a
complete group renders as a link and the browser does the rest. No fetch state,
no per-group tracking, no spliced rows.

Absent, the affordance is not offered and nothing below reaches for routing
context, so a grouped table still renders outside a `Router` exactly as before.
