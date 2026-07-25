---
'@lcabrera/server': minor
---

Add opt-in keyset ("seek") pagination to the SELECT builder. Pass
`SelectQueryDescriptor.cursor` — the sort-key tuple of the last row of the
previous page, plus the column that makes the sort a total order — and
`buildSelectQuery` resumes strictly after that row in O(limit) instead of walking
and discarding `offset` rows. Omit it and nothing changes: `OFFSET` remains the
default, and an offset query's SQL is byte-identical to before.

The emitted predicate is a NULL-aware lexicographic comparison rather than the
compact `(a, b) > ($1, $2)` row form, which cannot express mixed sort directions
and silently stops a scroll at the first NULL in a sortable nullable column. A
cursor the builder cannot resume correctly — no sort, a tuple that does not match
it, or one not ending on a non-null unique column — throws at construction time,
the same posture as refusing an unfiltered UPDATE. See ADR-052.
