# ADR-083 — A group is foldable only where a row survives to undo the fold

- **Status:** Accepted
- **Date:** 2026-08-19
- **Scope:** `@lcabrera/ui` — which groups carry a fold control, and what "collapse all" means
- **Issue:** #774 — expand and collapse every group at once
- **Narrows:** [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the fold model its #802 amendment describes, unchanged except for the case below
- **Related:** [ADR-067](./ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md) (expansion is the collapsed set), [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (expansion is client state, keyed by path), [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) (the grand total sits at the top level, not above it), [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) (where focus goes when a row disappears)

## Context

#802 moved the fold control off the subtotal that _ends_ a rollup block and onto
every row that _states_ the level, so the reader finds it where they are looking.
A row folds its **ancestors**, and which ancestors it may fold came from one
question: is this level somebody's parent? A level that owns rows has something
to hide, so it got a control.

#774 then asked for the same thing at once — collapse every group, expand every
group — and had to name the set it operates on. Reusing "every level that is
somebody's parent" is the obvious answer, and it is where this came apart.

## Problem

Under `rollup` and `cube` a parent level always has a row of its own: the
subtotal. Fold `(Berlin)` and the subtotal row `Berlin ·total·` stays on screen,
carrying the control that reopens it. That is what makes the fold reversible, and
it held for every case #802 was tested against.

Under `flat` it does not. A flat grouped read emits one grouping set — the whole
key list — so with keys `city › status` the result is:

```
(Berlin, Open)
(Berlin, Shut)
(Paris,  Open)
```

`(Berlin)` is the parent of the first two rows and **no row is `(Berlin)`**.
Offering that fold hides both rows and leaves nothing behind. The group cannot be
reopened from the grid at all: the control was on the rows that just disappeared.
It is a one-way trip out of the data, undone only by clearing grouping and
starting again.

The bug is reachable today from the per-row chevron; the reason it went unnoticed
is that a rollup grid, which is what the feature was built against, cannot
produce it. Collapse-all would have made it the _default_ outcome: on a flat grid
one click would empty the table.

## Options considered

1. **Keep parenthood as the test, and special-case collapse-all** to skip the
   outermost level. Fixes the button and leaves the chevron able to do the same
   damage one group at a time.
2. **Render a placeholder row for a folded ancestor that has none** — a
   grid-created "Berlin (collapsed)" row.
3. **Ask the second question**: a level is foldable only if it owns rows _and_
   renders a row of its own.

Option 2 is the one worth stating a reason against, because it is what a
spreadsheet does and it would make every level foldable in every mode. It is
rejected because a grouped read returns whole (ADR-059) and the grid never
computes a group: a placeholder would have to carry a label and a count that no
row in the result holds, and inventing an aggregate is exactly the line the Table
does not cross. The reader would also be shown a row that vanishes on expand,
which no other row in the grid does.

Option 1 fails the more important test: it leaves two different answers to "can
this be folded" — one for the chevron, one for the menu — which is the drift the
command layer exists to prevent.

## Decision

**A group is foldable only where a row survives the fold to undo it.**

Concretely, `collectFoldableGroupPaths` intersects two sets read off the same
tree nodes: the paths some row calls its parent, and the paths some row _is_. The
result is published from `resolveTableGroupTree` as `foldableGroupPaths`, and it
is the single answer behind all three surfaces —

- the per-row chevrons (`resolveGroupLevelDisclosures`),
- the keyboard fold, which reads the same row metadata,
- and the fold-every-group pair (`useTableGroupFoldAll`).

**"Collapse all" therefore means collapse to the outermost level, never to
nothing** — and that follows from how a collapse hides rows, not from what is in
the set. `resolveGroupTreeNodes` asks whether any _proper_ prefix of a row's path
is collapsed, so a collapse hides a group's **descendants** and never the group
row itself. Top-level groups are therefore in the foldable set — they own rows —
and folding them leaves their own rows standing. The grand total survives because
it is nobody's descendant, and the root is never foldable, which is what stops
the whole table sitting inside one collapsible subtree.

So the action needs no special case and the button's disabled state is the same
predicate.

**Under `flat`, nothing is foldable, and the grid says so.** The chevrons are
gone and both menu items are disabled, which is the honest report: a flat result
has no hierarchy on screen, so there is nothing there to fold.

## Consequences

- The flat-mode chevron introduced by #802's amendment is withdrawn. It looked
  like a feature and was a data-loss affordance.
- A collapse-all has no single folded path to hand focus back to, so the ancestor
  is read off the focused row instead (`resolveOutermostGroupPathKey`) and passed
  to the same `resolveGroupCollapseFocusTarget` a single collapse uses. ADR-062's
  generic rule — nearest survivor at the same index — stays rejected here for the
  reason it was rejected for a single collapse: after folding every level, the
  row at that index is typically the grand total.
- `aria-rowcount`, the body's declared height and both virtualization spacers all
  follow the surviving rows, which they already did; collapse-all is simply the
  largest change to that set the grid can make, and is asserted as such.
- Expansion still survives a sort or filter change, because nothing here changes
  how it is keyed (ADR-061).

## Alternatives considered

**Raise the question to the grouping mode.** "Disable folding when mode is
`flat`" reaches the same outcome today by asking a different question, and breaks
the moment a mode emits a partial set of levels — `cube`, whose grouping sets are
not prefixes of one another, is already close. Asking the rows keeps the answer
correct for whatever the read emits.

**Let collapse-all fold everything and rely on "expand all" to undo it.** The
menu item does survive a fold of the whole table, so the state is technically
recoverable. Rejected because the recovery is a different control in a different
place from the one that caused it, and because a grid showing nothing gives the
reader no reason to believe their data is still there.

## References

- [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the fold model
  this narrows, and its #802 amendment
- [ADR-067](./ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md)
  — why folding is a set of collapsed paths
- [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — why the grid never
  computes a group, which is what rules the placeholder row out
- The flat-mode behaviour is reproducible from
  `resolveTableGroupTree.util.test.ts` — "offers no fold under `flat`" and
  "offers the same path under rollup" are the same two rows with one subtotal
  added, which is the only difference that decides it
