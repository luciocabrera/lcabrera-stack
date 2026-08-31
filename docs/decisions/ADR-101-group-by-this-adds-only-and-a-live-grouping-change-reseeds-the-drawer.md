---
governs:
  - ui
---

# ADR-101 — "Group by This" adds only, and a live grouping change re-seeds the open drawer

**Status:** Accepted

**Issue:** [#1050](https://github.com/luciocabrera/lcabrera-stack/issues/1050)

**Corrects**
[ADR-100](./ADR-100-the-header-menu-refuses-the-layout-actions-a-grouped-column-cannot-take.md)
— its Decision states "`Group by This` keeps toggling off" and its
Alternatives rejects making it add-only. That is no longer what the code does.
An ADR is a dated record, so ADR-100's body stands as written and this record
carries the change.

## Context

ADR-100 added `Remove This Group` (then named `Remove from Grouping`) and kept
`Group by This` toggling off, on the grounds that changing a working gesture
removed a redundancy nobody had complained about. Once both items shipped and
were used, the redundancy was the complaint: two adjacent items in one menu
performed the same removal, and the one whose label says "group by" was the
less obvious of the two.

Separately, using either item exposed a second defect. The settings drawer
seeds its drafts once, at mount — `TableDrawerContext.provider.tsx` reads the
live grouping store with a plain `get()`, and `useStore` keeps only the first
`initialState`. `useSetTableGrouping` writes the grouping store, the columns
store and the URL, but bumps nothing the drawer watches. So with the drawer
open, removing a key from the header menu left the Grouping tab still listing
it, and the Columns tab still listing measure columns the grid no longer
painted.

`drawersSyncNonce` already solves exactly this. `TableDrawersSection` keys
`TableDrawerProvider` on it, so bumping it remounts the provider and re-seeds
every draft. Sorting, pinning and visibility from the same header menu already
bump it; grouping never did.

## Decision

**`Group by This` adds only.** Applied, it stays highlighted (`aria-pressed`)
and is disabled, carrying `TABLE_GROUP_KEY_APPLIED_LABEL` as its title so the
disabled state names its own cause and points at the item that does remove.
`Remove This Group` is the only removal.

**`useSetTableGrouping` bumps `drawersSyncNonce`** after it writes the two
stores, and only on a change that was actually persisted — a refused or
oversized write returns before the bump, so a rejected interaction does not
discard the user's drafts.

One invariant moved rather than disappeared. A URL can seed a grouping the
catalogue refuses (ADR-061), so something must always be able to undo it. That
used to be `Group by This`'s second click; it is now `Remove This Group`, which
is gated on the key being applied and never on the refusal.

## Consequences

**A full grouping is still editable at the depth cap.** `Group by This` is
disabled at `MAX_TABLE_GROUP_KEYS` whether or not this column is one of the
keys, so the escape hatch is entirely `Remove This Group`. If that item were
ever hidden rather than disabled, a grouping at the cap would become
uneditable from the header.

**The nonce bump discards every uncommitted draft in the drawer**, not only the
grouping one, because it remounts the whole provider. That cost is already paid
for pinning, sorting and visibility, so this makes grouping consistent rather
than introducing a new hazard — but it does mean editing the drawer and using
the header menu in the same breath loses the former.

**A remount per grouping interaction.** The drawer is small and only mounted
while open, so the cost is a re-seed of three drafts. The alternative — a live
subscription — is heavier and is discussed below.

## Alternatives considered

1. **Subscribe the drawer's drafts to the live stores.** Rejected: a draft is a
   draft precisely because it is not live, and merging live changes into
   half-edited local state has no obviously right answer. The nonce remount is
   blunt but its semantics are clear — the drawer restarts from what is true.
2. **Bump the nonce inside `applyGroupingReducer`.** Rejected: the reducer is
   pure and knows nothing of stores. The bump belongs beside the two `set`
   calls it must accompany.
3. **Keep the toggle and drop `Remove This Group`.** Rejected by the issue's
   owner, who asked for the reverse: the explicit item is the discoverable one,
   and "Group by This" reads as an add.

## References

- [#1050](https://github.com/luciocabrera/lcabrera-stack/issues/1050)
- [ADR-100](./ADR-100-the-header-menu-refuses-the-layout-actions-a-grouped-column-cannot-take.md)
  — the record this corrects.
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — why a
  refused grouping can be applied at all.
