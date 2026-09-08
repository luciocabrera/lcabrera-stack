---
governs:
  - ui
---

# ADR-115 — The settings panel separates what the table asks from how the panel is shaped

**Status:** Accepted

**Corrects:** [ADR-114](./ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md), whose two paragraphs placing the tab order and totals position in the General tab this replaces.

## Context

[ADR-114](./ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md)
gave the reader the tab order and put the drag in the General tab, and moved
totals position there in the same pass. Both landed under the tab that otherwise
holds one thing: clear and reset for each part of the table's query state. So the
General tab now scrolled past Filters, Sorting and Columns actions into a radio
group that writes a search param, and then into a drag list that writes a cookie
and does not go through Accept at all. Three commit paths, one tab, no way to
tell them apart by looking.

The Grouping tab had the matching problem from the other side. Its subject is
which dimensions the read groups by and which measures it aggregates, and sitting
between the keys and the measures was the mode radio, which decides whether the
read emits subtotal rows. That is a totals question, not a dimension or a measure.

One thing was missing rather than misplaced. The General tab carries a clear and
a reset for filters, for sorting and for columns, and carried none for grouping,
even though `GroupingSectionToolbar` already renders exactly that pair in its
footer variant.

The order itself is per table, keyed by `persistenceKey`, which ADR-114 accepted
as matching every other drawer preference. What that leaves is a reader who wants
Details first everywhere having to drag it on every table they open.

## Decision

**A new `advanced` role, last in `TABLE_SETTINGS_TAB_ROLES`, holds what shapes the
panel and what governs totals.** The Advanced tab renders the grouping mode, the
totals position and the tab order. It is a role like the others, so it can be
dragged anywhere in the strip, and the column drawer maps no key onto it and
therefore does not paint it.

**The General tab is the query state's clear and reset, and nothing else.** It
gains the Grouping pair it was missing, rendered only where the route declared
`isGroupingEnabled` so the heading cannot stand over an empty toolbar.

**The Grouping tab is dimensions and measures.** `GroupingModeSection` moves out
of it, into `AdvancedSettingsSection/`, alongside the `TotalsPlacementSection`
that ADR-114 had already moved out of it once.

**Advanced always renders, and its totals half does not.** The tab order is a
reason for the tab on any table; the two totals controls are gated on
`isGroupingEnabled`, and totals position stays gated on `rollup` on top of that.

**A reader states a default tab order once, in Global Settings.** A new Table
Panel tab holds the same `DraggableList` of roles, staged in the settings draft
and written to `tablePanel.settingsTabOrder` in the global-settings cookie on
Accept, like every other preference on that page. `readTableLoaderStateFromRequest`
reads it and a table that stored no order of its own opens in it; a table whose
UI-flags cookie carries an order keeps that one. So the global value is a default,
not an override, and the per-table drag ADR-114 introduced still wins where it has
been used.

**Both reads sanitise through `resolveSettingsTabOrder`.** The global preference is
a cookie like the per-table one, so it degrades the same way: a name that is not a
role is dropped, a repeat is stated once, and every role the stored order did not
name is appended in the declared order. `advanced` therefore appears at the end of
an order written before it existed, rather than the tab going missing.

**A draggable row's label truncates rather than wraps.** `drawerSectionStyles.itemLabel`
and `DraggableListItem`'s content box get `overflow: hidden`, `text-overflow:
ellipsis`, `white-space: nowrap` and `min-width: 0`, and each label carries the
full text in `title`. Two lines in one row changed that row's height while it was
being dragged past.

## Consequences

**Advanced mixes a staged control with an immediate one.** The mode and the
position are drafts behind Accept; the tab order commits on drop, for the reason
ADR-114 gave. The tab therefore has no single commit rule, which the General tab
now does. This is the cost of the split, and it is a smaller one: Advanced is
where a reader goes deliberately, and a drag that did nothing until Accept reads
as broken.

**Two places now write the same kind of order, and they can disagree.** A reader
who drags in Global Settings after dragging in a table sees no change on that
table, because the per-table cookie wins. Nothing surfaces that, and there is no
control to clear a table's order back to the global one. If it is reported, the
place to add it is the Advanced tab, beside the drag.

**`GlobalSettingsState` gained a key without a cookie version bump.** An existing
cookie carries no `tablePanel`, `toGlobalTablePanelPreferences` returns undefined
for it, and the fallback supplies `{}` — so the old payload keeps parsing and
bumping the version would have discarded the pinning and navigation preferences
already stored. Every fixture that builds a `GlobalSettingsState` literal had to
gain the key, which is what `vp run typecheck:all` catches.

**Three `*.stylex.ts` modules moved package-relative paths.** `stylex-module-paths.test.json`
is updated in the same commit. None of the three calls `defineVars`, so no custom
property was renamed and no consumer's `createTheme` can drift; the register is
blunter than the risk it guards, deliberately.

## Alternatives considered

1. **Leave the tab order in General and move only the totals.** Rejected: the drag
   is the one control on that tab that does not go through Accept, so it is the
   clearest thing to move, not the thing to keep.
2. **Fold Advanced into Details.** Rejected: Details is read-only metadata about
   the table. Putting the only writes on the panel's shape behind a tab that
   otherwise writes nothing hides them.
3. **Make the global order an override rather than a default.** Rejected: it would
   take away the per-table drag ADR-114 added, and a reader who arranged one
   table's tabs and then set a global default would silently lose the first
   arrangement.
4. **A second cookie for the global order.** Rejected: the global-settings cookie
   already carries the reader's cross-table preferences and is read in the same
   loader call. A second one is a second thing to scope by `appId` and expire.
5. **Wrap the label instead of truncating it, and let the row grow.** Rejected on
   what was reported: the aggregate rows are the ones that overflow, and a row
   that changes height under the pointer is what made the drag hard to aim.

## References

- [ADR-114](./ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md) — the tab order and the panel width this amends
- [ADR-085](./ADR-085-a-preset-makes-ungrouped-a-real-state.md) — where totals placement commits
- [#1118](https://github.com/luciocabrera/lcabrera-stack/issues/1118)
