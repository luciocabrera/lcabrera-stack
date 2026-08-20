---
'@lcabrera/ui': minor
---

A Table column can now carry **several aggregate functions at once**. Applying
`avg` to a column already showing `min` adds to it rather than replacing it, from
the settings drawer's "Add Aggregate" panel and from the column-header menu
alike, and the group rows show both — each named, so two numbers in one cell are
readable.

Previously the second selection silently discarded the first, and nothing said
so. The cap was not an oversight: `TableGroupingState.aggregates` was a
column-to-function map because that was the shape the compact `grouping` URL
param could carry, and a state the transport cannot express is a state a shared
link silently loses.

**The shapes that changed.** `TableGroupingState.aggregates` and `.shares` are
now ordered lists of `{ columnKey, fn }` records, as are
`TableMetaState.groupingAggregates` and `.groupingShares`. On the wire, the
`grouping` param's `agg` and `share` members are ordered arrays of compact
`"<columnKey>:<fn>"` strings. A consumer building either of those by hand — a
route with a `defaultGrouping`, or a hand-written loader seeding the grouping
store — has to move with them.

**A link written before this reads as ungrouped.** The old `{"agg":{…}}` map is
outside the new vocabulary, so it refuses the whole payload and the table opens
flat — the same whole-state refusal every other unreadable `grouping` param gets,
rather than a half-applied query. Only the `agg` and `share` members are
affected; a `grouping` param with neither is unchanged.

**A share names a measure now, not a column.** `sum` and `count` are both
shareable, so on a column carrying both, a bare column key could not say which
measure's percentage was meant. Each measure takes its own share toggle, and
removing one measure prunes only that measure's share.

**Order is now state.** The aggregate list keeps the order it was built in, that
order survives the URL round trip, and it is what the staged list renders. A
column key containing a `:` round-trips correctly: the token is split on its last
separator and the suffix checked against the closed function vocabulary.

Sorting and pinning are untouched. They remain single-valued, and keep the
shared `deriveToggleCommandState`; the aggregate commands got their own
derivation beside it rather than widening one that sorting also uses.
