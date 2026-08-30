---
'@lcabrera/ui': patch
---

`Collapse This Level` folds the groups its own column states.

It folded the level above the open column instead, so the column acted on was
the one whose rows disappeared, and the three fold controls in a key cell — the
chevron, the expansion keys and the menu pair — did not agree with each other.
They now answer from one derivation: a level command is the union of the folds
the chevrons in that column offer.

The pair is offered on every applied group key and withheld on a column that is
none. It is disabled wherever that column's groups own no rows, which is the
innermost key's ordinary state and every key column's state under `flat`. On the
outermost key it is live, and folding from there leaves that key's own rows on
screen carrying a working chevron (ADR-097).
