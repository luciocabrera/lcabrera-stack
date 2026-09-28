---
'@lcabrera/ui': patch
---

The settings drawer's column clear, now labelled "Clear Order, Visibility &
Pinning", empties the staged column order and pinning along with visibility.
It used to restore the pinning the table had applied, so it reverted instead of
clearing. "Clear All" now empties pinning the same way. The reset actions still
restore the applied state.

"Order by Sorting" now works when no custom column order is staged. It used to
move only columns already listed in the staged order, so with the declared
order it did nothing.
