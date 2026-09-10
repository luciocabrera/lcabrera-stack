---
'@lcabrera/ui': minor
---

A tab can decline the tab body's horizontal inset, and the grouping settings
clear and reset each of their subjects on its own.

`TabItem` takes an optional `hasPadding`. It defaults to `true`, so every
existing tab paints the inset it painted before. Setting it to `false` drops the
inset for that panel alone, which is what a nested tab strip needs: the parent
already inset its body once, and the reader was paying for it twice in a panel
that has little width to spare. The inset moves from the shared scroll container
onto each panel to make that possible; the container keeps its scrollbar gutter.

The Grouping tab's three sub-tabs declare it, so their content is inset once by
the drawer tab that holds them. The opt-out belongs on the nested strip rather
than on the drawer tab: a drawer tab's inset also positions its section header,
its footer toolbar and any nested tab strip, none of which the nested panels put
back.

**Group keys and aggregates can now be cleared and reset independently.** The
pair in each sub-tab header acts on that sub-tab's subject, and the pair in the
footer still acts on the whole grouping. Periods travel with the keys and shares
travel with the aggregates, so a scoped action carries the state that depends on
it. Each scoped clear is disabled while its own subject is empty, and a locked
grouping offers none of them.

Every scoped action goes through the same reducer the unscoped pair uses, so
none of them can stage a grouping the table would refuse. That is what decides
the two asymmetries below; they are the grouping model, not these actions.

Clearing the group keys clears the aggregates too. The grouping state has no
representation for a measure with no key to measure over, and the reducer
collapses the whole grouping when the last key goes. The reverse does not hold:
clearing the aggregates leaves the keys alone.

Resetting the aggregates does nothing while no group key is staged, for the same
reason. Resetting the group keys puts back the mode they were applied with when
the draft has no keys of its own, so clearing the keys and resetting them
round-trips a rollup grouping instead of flattening it.

`Clear Grouping` is now offered whenever either subject holds something, rather
than only when a group key does; it previously sat disabled while aggregates
were staged against no key.
