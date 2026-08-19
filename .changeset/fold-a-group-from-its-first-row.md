---
'@lcabrera/ui': minor
---

A grouped grid folds a group from the row that starts it, not the subtotal that
ends it.

The chevron sat on whichever row owned loaded children, which under a rollup is
the **subtotal** — and a subtotal is emitted after the rows it totals. So a
group's label appeared at the top of its block and the control for it at the
bottom: to collapse a group you had to scroll to its end first, and on a group
longer than the viewport the control for the block you were looking at was
off-screen entirely.

The control now renders in the cell where its level's key is **drawn**. A row
states its ancestors and does not own them, so those are the levels it folds,
each in that key's own column; a carried cell renders no control, exactly as it
renders no label. `ArrowLeft`/`ArrowRight` act on the level the focused column
holds, so the keyboard folds what the chevron in the same cell folds.

Two rules keep it coherent, and both are stated in the ADR-080 amendment:

- **A row skips its own group only when it is a subtotal, and only while that
  group is open.** Every other group row precedes what it owns, so folding
  itself already puts the control at the top. Once a group folds, its subtotal
  is the only row left, so the control returns there and the group can be
  reopened.
- **A leaf that has already drilled answers with its drill**, not a fold, because
  the drill reports a group as open from the moment the fetch starts rather than
  when its rows arrive.

No tab stops and no ARIA are added. The chevron is still `aria-hidden` and still
not a button, and `aria-expanded` stays on the row describing that row's own
group — a row does not report its ancestors' states.

The published surface is unchanged — `reports/api-surface/ui.txt` is
byte-identical, because the types this moves through (`TableGroupDisclosureState`
and the new `TableGroupLevelDisclosure`) are internal to the Table and are not
exported from the package. What a consumer sees is the behaviour: where the
chevron is, and which group it folds.
