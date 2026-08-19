---
'@lcabrera/ui': minor
---

A grouped Table can open or fold **every** group in one action, and a fold that
could not be undone is no longer offered at all.

The column header's grouping section gains **Expand All Groups** and **Collapse
All Groups**, beside "Clear Grouping" and gated the same way — always shown so
the menu keeps its shape, disabled when there is nothing to do. They are ordinary
menu items, so they are reachable by keyboard, and they take effect immediately
rather than being staged behind the settings drawer's Accept: expansion is client
state, not a setting.

**"Collapse all" folds to the outermost level, never to nothing.** A top-level
group and the grand total are nobody's parent, so both stay on screen and there
is something left to expand back from.

```
Cancelled  Business  Critical            Cancelled ·total·
Cancelled  Business  ·total·             Active    ·total·
Cancelled  Retail    ·total·      →      ·total·
Cancelled  ·total·
Active     ·total·
·total·
```

**Breaking in effect for `flat` grouping, though the API is unchanged.** A row
could previously fold an ancestor level — `(Berlin)` in a `city › status`
grouping — that a flat read never emits a row for. Folding it hid every row of
the group and left nothing behind carrying the control, so the group could not be
reopened from the grid at all. A group is now foldable only where a row survives
the fold to undo it, which under `rollup` and `cube` is always its subtotal.
Under `flat` the chevrons are therefore gone and both new menu items are
disabled — a flat result has no hierarchy on screen to fold.

For consumers reading the group tree directly, `resolveTableGroupTree` now also
returns `foldableGroupPaths`: the one set every chevron, the keyboard fold and
the two menu items are derived from.

Focus follows the fold. Collapsing every level at once moves the grid's focus
target to the top-level group containing the focused row, rather than to whatever
row shifted into its index — which after a collapse-all is usually the grand
total.
