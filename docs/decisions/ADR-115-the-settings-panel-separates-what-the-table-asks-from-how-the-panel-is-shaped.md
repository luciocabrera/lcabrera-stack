---
governs:
  - ui
---

# ADR-115 — The settings panel separates what the table asks from how the panel is shaped

**Status:** Accepted

**Corrects:** [ADR-114](./ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md), whose tab-order decision this replaces: the paragraphs placing the drag and the totals position in the General tab, and the scoping of the order to one table.

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

The order itself was per table, keyed by `persistenceKey`, which ADR-114 accepted
as matching every other drawer preference. That scoping is the part that does not
hold up. The pinned state, the selected tab and the expanded filters are all
answers about the table in front of you. Which order the tabs sit in is not: it
is the same answer on every table, and it is the same kind of answer as the
navigation size or the pin-side default, which already live on the Settings page.
Scoping it per table both made the reader repeat it and put it in the wrong
register.

## Decision

**A new `advanced` role, last in `TABLE_SETTINGS_TAB_ROLES`, holds what governs
totals.** The Advanced tab renders the grouping mode and the totals position. It
is a role like the others, so it can be placed anywhere in the strip, and the
column drawer maps no key onto it and therefore does not paint it.

**The General tab is the query state's clear and reset, and nothing else.** It
gains the Grouping pair it was missing, rendered only where the route declared
`isGroupingEnabled` so the heading cannot stand over an empty toolbar.

**The Grouping tab is dimensions and measures.** `GroupingModeSection` moves out
of it, into `AdvancedSettingsSection/`, alongside the `TotalsPlacementSection`
that ADR-114 had already moved out of it once.

**Advanced is registered only when it has something to render, and it says so
itself.** Both its controls are about subtotals, and each carries its own guard:
`GroupingModeSection` renders nothing under a locked preset, and
`TotalsPlacementSection` renders nothing outside `rollup`. `isGroupingEnabled`
alone therefore still paints an empty tab on a locked, flat table.
`useHasAdvancedSettings` is the one place those conditions are combined, and
`TableSettingsDrawerBody` asks it rather than restating them — the same reason
the General tab's Grouping heading is gated on `!isGroupingLocked` as well as on
`isGroupingEnabled`, since `GroupingSectionToolbar` has an early return the other
three toolbars do not.

**The tab order is a global preference and has no per-table form.** A new Table
Panel tab on the Settings page holds the `DraggableList` of roles, staged in the
settings draft and written to `tablePanel.settingsTabOrder` in the global-settings
cookie on Accept, like every other preference on that page.
`readTableLoaderStateFromRequest` reads it, and that is the only channel:
`TabsOrderSection`, `useSetTableSettingsTabOrder` and the `settingsTabOrder` entry
in `getPersistedUiState` are all deleted, so nothing writes an order into a
table's UI-flags cookie any more.

**The order is sanitised on read through `resolveSettingsTabOrder`,** as ADR-114
already had it: a name that is not a role is dropped, a repeat is stated once, and
every role the stored order did not name is appended in the declared order.
`advanced` therefore appears at the end of an order written before it existed,
rather than the tab going missing.

**A draggable row's label truncates rather than wraps.** `drawerSectionStyles.itemLabel`
and `DraggableListItem`'s content box get `overflow: hidden`, `text-overflow:
ellipsis`, `white-space: nowrap` and `min-width: 0`, and each label carries the
full text in `title`. Two lines in one row changed that row's height while it was
being dragged past.

## Consequences

**Every tab now has one commit rule.** ADR-114's drag committed on drop while
everything around it staged behind Accept, which was defensible only while the two
sat in the same tab. Moving the order to the Settings page removes the mixture
rather than relocating it: Advanced stages behind Accept like General and
Grouping, and the Settings page stages behind its own Accept like every other
global preference.

**An order stored per table under ADR-114 stops being read, and dropping the key
from a type was not enough to do it.** `parseVersionedPayload` casts rather than
checks, so `readPersistedUiFlagsFromCookie` handed back whatever keys the JSON
carried and the stale `settingsTabOrder` still reached the meta store — where,
for a reader with no global preference, it still governed. `toPersistedUiState`
now narrows the parsed payload to the keys `PersistedUiState` declares, which is
what makes that type true of the value rather than merely asserted about it, and
the loader states `settingsTabOrder` from the global preference unconditionally
rather than only when one exists. Either alone closes this; both are cheap, and
the first also covers the next key this type drops. A reader who dragged a
table's tabs after #1114 merged gets the declared order back until they set one
on the Settings page. The degradation is visible and one action fixes it for
every table at once, which is the trade this ADR is making.

**Changing the order needs a navigation to take effect on an open table.** It is
read in the loader, like `preferredGroupingMode` and `defaultGroupFold`, so a
reader who reorders on the Settings page sees it on the next table they open
rather than in a tab already on screen. Reading the global store inside the Table
instead would make `GlobalSettingsProvider` a hard dependency of a component that
is meant to work without one.

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
3. **Keep the per-table drag and let the global order be its default.** This was
   built first and rejected on what it produced: once a reader dragged on a table,
   that table's cookie won for good, nothing cleared it, and a later change to the
   global order silently skipped that one table. The fix would have been a third
   control undoing the second. Global-only removes the conflict instead of
   managing it, and the register argument settles which side to drop — the tab
   order is the same answer on every table, so the per-table form was the one with
   no reason to exist.
4. **A second cookie for the global order.** Rejected: the global-settings cookie
   already carries the reader's cross-table preferences and is read in the same
   loader call. A second one is a second thing to scope by `appId` and expire.
5. **Wrap the label instead of truncating it, and let the row grow.** Rejected on
   what was reported: the aggregate rows are the ones that overflow, and a row
   that changes height under the pointer is what made the drag hard to aim.

## References

- [ADR-114](./ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md) — the tab order and the panel width this amends
- [ADR-085](./ADR-085-a-preset-makes-ungrouped-a-real-state.md) — where totals placement commits
- [#1114](https://github.com/luciocabrera/lcabrera-stack/pull/1114) — the pull request that shipped the per-table order this replaces
- [#1118](https://github.com/luciocabrera/lcabrera-stack/issues/1118)
