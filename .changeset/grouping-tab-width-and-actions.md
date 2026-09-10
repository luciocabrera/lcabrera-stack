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

The Grouping tab declares it, so its three sub-tabs are inset once.

**Group keys and aggregates can now be cleared and reset independently.** The
pair in each sub-tab header acts on that sub-tab's subject, and the pair in the
footer still acts on the whole grouping. Periods travel with the keys and shares
travel with the aggregates, so a scoped action carries the state that depends on
it. Each scoped clear is disabled while its own subject is empty, and a locked
grouping offers none of them.

One asymmetry is worth stating, because it is the grouping model rather than
these actions: clearing the group keys clears the aggregates too. The grouping
state has no representation for a measure with no key to measure over — the
reducer collapses the whole grouping when the last key goes — so the reverse
does not hold. Clearing the aggregates leaves the keys alone.

`Clear Grouping` is now offered whenever either subject holds something, rather
than only when a group key does; it previously sat disabled while aggregates
were staged against no key.
