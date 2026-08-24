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
