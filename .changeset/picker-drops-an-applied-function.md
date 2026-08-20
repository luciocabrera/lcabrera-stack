---
'@lcabrera/ui': patch
---

The settings drawer's "Add Aggregate" **function** picker no longer offers a
function the chosen column already carries.

Since a column began carrying several aggregates at once, adding one has been an
append with a duplicate guard, so re-picking an applied function was accepted and
then changed nothing: the aggregate list stayed as it was and no message
explained why. That is the same shape as the header-menu defect just fixed — a
control that takes a choice and does nothing reads as a bug — and the house rule
is that an illegal command is never offered rather than offered-and-disabled.

The subtraction is a new drawer-owned derivation, `resolveAddableAggregates`,
composed **on top of** the shared `resolveOfferableAggregates` rather than folded
into it. The two offering surfaces deliberately diverge here: the picker only
ever adds, so an applied function is a choice that cannot change anything, while
the column header menu **toggles** — there the applied item is the only way to
remove that aggregate, so it must keep being offered. Teaching the shared
predicate about applied aggregates would have forced one answer on both, and the
menu would have lost its clear affordance. Legality still comes from the one
predicate, so neither surface can disagree about which functions a column
supports at all.

Clearing an aggregate puts its function straight back in the picker. A column
that already carries every function its type supports now says so, in place of
the function control, instead of presenting an empty list — the column list still
offers such a column, because that list excludes group keys and unaggregatable
columns, not exhausted ones. The Add button acts on what the picker currently
offers, so a selection that stops being addable underneath it — the column is
staged as a group key, or the function gets applied from elsewhere — can no
longer be submitted.
