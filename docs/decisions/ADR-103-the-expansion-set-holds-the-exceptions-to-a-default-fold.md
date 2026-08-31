---
governs:
  - ui
---

# ADR-103 — The expansion set holds the exceptions to a default fold

**Status:** Accepted

**Issue:** [#1052](https://github.com/luciocabrera/lcabrera-stack/issues/1052)

**Extends**
[ADR-067](./ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md)
— which states the set as `collapsedGroupPaths`, membership meaning hidden.
That is still exactly what it means under the shipped default; this record
covers what it means under the other one.

## Context

Global Settings now carries a **Default Group Fold**: whether a grouped table
lands on its summary rows or opens showing everything. ADR-067's model cannot
express the collapsed answer. Membership means collapsed and an empty set means
fully expanded, so "start collapsed" would have to name every group — and a path
key is built from a group's own values, which are not known until the rows
arrive. Seeding it after the first render puts a fully open grid on screen and
then folds it, which is a visible jump on exactly the setting whose purpose is
to avoid one.

Two other preferences ship in the same tab and neither needed this, which is
worth stating because it is why only this one moved the model. **Totals
position** resolves in the loader, behind the search param and this table's own
cookie. **Totals mode** resolves at the interaction that creates a grouping from
no keys — _not_ in the loader, because the codec drops a `flat` mode rather than
emitting it, so a link whose author chose flat and one whose author chose nothing
are the same string; a preference read from the param would reinstate itself
every time the reader switched back. That is the failure `resolveLoaderGrouping`
already records about a route's default grouping.

## Decision

**The set holds the groups folded the other way from the default**, and is named
`toggledGroupPaths` for it. `TableGroupExpansionState` gains `defaultFold`,
seeded from `TableMetaState.defaultGroupFold` — the reader's answer, read off
the settings cookie by the loader.

Under the shipped `expanded` default this is byte-for-byte the old model:
membership means collapsed, empty means fully open. Under `collapsed` the same
membership means expanded, and an empty set is a fully folded grid — which is
the property the whole change exists for. A group nobody has touched follows the
default with no path enumerated and no data needed to name one.

**One predicate reads membership.** `isGroupCollapsed` is the only place the set
is asked about a path, so the two polarities cannot come to disagree. That is a
rule the rename can hide rather than surface: the field kept its type, so two
raw `has` reads compiled unchanged and only review caught them — one publishing
`rowMeta.isExpanded`, which reaches `aria-expanded`, and one deciding which way
each level's chevron points. `grep` for a bare `.has(` on the set is the check;
a green build is not.
`countCollapsedGroups` and `resolveFoldAllTarget` are built on it and replace two
readings that were only ever right under `expanded`: `isExpandAllEnabled` was
`toggledGroupPaths.size > 0`, and expand-all wrote the empty set.

**The preferences reach the Table through the loader's meta, not through
`GlobalSettingsContext`.** Reading them off the context made every grouping hook
throw in a Table rendered outside the settings provider, which the package does
not otherwise require. It also matches what the config provider already
guarantees: the client renders exactly what the server did.

## Consequences

**A rename with 135 call sites**, mechanical everywhere but the four semantic
ones above. The alternative was a field whose name is right half the time, which
is the failure every gate in this repo exists to catch.

**`TableGroupExpansionState` is a published type and gained a required member.**
A consumer reading the store is unaffected; one constructing the state must add
`defaultFold`. These packages are `0.x`, so it ships as a `minor`.

**Changing the preference does not re-fold an open table.** It is a default
applied when the expansion store is seeded, so it lands on the next load. That is
what "default" means here, and the alternative — re-folding a grid the reader has
been working in — is worse.

**A `collapsed` default and a route-declared grouping now land together**, so a
route that groups by default opens on its summary rows. That is the intended
reading of the preference, and it is the one case where a reader's setting
changes what a route's own default looks like on arrival.

## Alternatives considered

1. **Seed `collapsedGroupPaths` with every foldable path after the first data
   arrives.** Rejected: it needs an effect, it flashes a fully open grid first,
   and it has no answer for a group that appears later — a filter change would
   open it, since the seeding already ran.
2. **Keep the name and let membership mean two things.** Rejected: the field is
   published and a reader would take `collapsedGroupPaths` at its word. A name
   that lies is worse than a rename.
3. **Resolve every preference in the loader.** Rejected for the mode, for the
   reason in Context. Keeping the three in one place would have cost the
   correctness of the one that cannot live there.
4. **Read the preferences from `GlobalSettingsContext` in the Table.** Rejected:
   it makes the settings provider a hard requirement of rendering a grouped
   Table, which it has never been.

## References

- [#1052](https://github.com/luciocabrera/lcabrera-stack/issues/1052)
- [ADR-067](./ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md)
  — the model this extends, and the source of the `collapsedGroupPaths` name.
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — why
  expansion is client state and never travels in the URL.
