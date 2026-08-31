---
'@lcabrera/ui': minor
---

Paint a grouped grid's measures in the order the aggregate list was staged in,
and stop the header menu offering the layout actions a grouped column cannot
take.

**The measure columns move.** `withAggregateColumns` spliced each measure into
the slot of the column it measured, so the painted order across columns was the
declared column order — a table declaring `order_no` before `total_amount`
painted `Count of Order #` first however the user had arranged the aggregate
list, while the settings drawer beside it listed that entry last. A fourth
derivation step, `withAggregateColumnOrder`, now orders the measure run by the
staged list, ranking each measured column by its **first** entry so that
column's measures stay contiguous — the header band is a visual span and only
covers neighbours. **If your grouping stages measures across more than one
column, its painted column order changes on upgrade.** Nothing persisted moves;
the derivation writes no state, and the aggregate list is now the one control
that decides the order. An ungrouped grid is untouched, and the settings
drawer's Columns tab follows, since it reads the same derivation.

**The header menu refuses what it cannot do.** A group key is force-pinned left
and forced visible by the layout derivation on every pass, so Pin Left, Pin
Right, Clear Pinning and Hide Column on one wrote state the next derivation
discarded — the click was accepted and nothing moved. A measure resolves every
layout action back to the column it measures, which then expands into all of
that column's measures, so pinning one subtotal pinned its siblings; its three
pinning items are now disabled while Hide Column stays enabled. Each disabled
item states the reason in a `title`, because a disabled button fires no pointer
events. Neither refusal applies to an ungrouped grid.

**A new `Remove from Grouping` item** sits between `Group by This` and the
whole-table `Clear Grouping`, dropping one key and leaving the rest of the
grouping standing. `Group by This` still toggles off, so nothing that worked
before stops working.
