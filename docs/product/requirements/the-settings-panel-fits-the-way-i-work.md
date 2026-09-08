---
id: the-settings-panel-fits-the-way-i-work
lines:
  - application
persona: data-user
state: met
packages:
  - ui
requires:
  - browse-and-edit-a-table-without-writing-sql
issues: []
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/SidePanel/SidePanel.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/TableSettingsDrawer/AdvancedSettingsSection/TabsOrderSection/TabsOrderSection.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/utils/orderSettingsTabs.util.test.ts
  - type: test
    ref: packages/ui/src/routing/loaders/readTableLoaderStateFromRequest.util.test.ts
  - type: code
    ref: packages/ui/src/components/SidePanel/SidePanelResizeHandle/SidePanelResizeHandle.component.tsx
  - type: doc
    ref: docs/decisions/ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md
  - type: doc
    ref: docs/decisions/ADR-115-the-settings-panel-separates-what-the-table-asks-from-how-the-panel-is-shaped.md
---

# The settings panel fits the way I work

## Statement

I spend the day in one or two tabs of the table settings and I reach past the
rest every time. The panel should let me put the tab I use first, and it should
be as wide as the work needs — the column list and the filter editors do not fit
in a fixed strip on a display with room to spare. I want to state that order
once, for every table I open, and still be able to arrange one table differently
without that choice leaking to the rest. What I set should still be there
tomorrow, and it should never leave the panel wider than the screen I open it
on.

I also want each tab to be about one thing. Clearing a filter and deciding where
a subtotal row sits are different questions, and reading past one to reach the
other is the same cost as reaching past a tab.

## Acceptance

- The settings panel has a splitter on its inner edge that resizes it by pointer
  and by keyboard, and reports the width it settles on separately from the width
  it passes through mid-drag. Decided by `SidePanel.test.tsx` → "resizes from the
  drag, and commits once the gesture ends" and "resizes from the keyboard, which
  a pointer gesture is not needed for".
- The width stays inside 320px–90vw whatever it is handed, so a width kept from a
  wider display cannot paint off the edge of a narrower one. Decided by
  `resolveSidePanelWidthBounds.util.test.ts` → "never hands back a ceiling under
  the floor", and by the `width` style in `SidePanel.stylex.ts`, which clamps the
  same band again in CSS.
- The Advanced tab lists every settings tab and a drop states the whole order,
  not the tab that moved. Decided by `TabsOrderSection.test.tsx` → "states a drop
  as the whole order, not the moved tab alone" and "lists every tab, in the order
  the drawers paint them".
- Settings carries a Table Panel tab holding the same list, and Accept persists
  the order the reader arranged. Decided by `Settings.component.test.tsx` →
  "persists the settings tab order from the Table Panel tab".
- A table that stored no order of its own opens in that global one, and a table
  whose own cookie carries an order keeps it. Decided by
  `readTableLoaderStateFromRequest.util.test.ts` → "starts a table that stored no
  order from the global preference", "keeps the order this table stored over the
  global preference" and "states no order when neither the table nor the reader
  has one".
- Arranging the tabs to the declared order clears the preference rather than
  storing it. Decided by `toGlobalTablePanelPreferencesUpdate.util.test.ts` →
  "writes the order back to undefined when it is the declared one".
- The General tab holds the clear and the reset for each part of the table's
  query state, including grouping, and holds nothing that writes a search param.
  Decided by `GeneralSettingsSection.test.tsx` → "composes width presets, section
  toolbars, and all-settings actions" and "offers no grouping actions for a route
  that cannot group".
- The Advanced tab is present on a table that cannot group, carrying the tab
  order without the two totals controls. Decided by
  `AdvancedSettingsSection.test.tsx` → "keeps the tab order for a route that
  cannot group, and drops the totals".
- That one order governs both the table settings tabs and a single column's tabs,
  matching them by what each tab is for rather than by its name. Decided by
  `orderSettingsTabs.util.test.ts` → "ranks a column drawer tab by the role it
  fills".
- An order stored before a tab existed, or naming one that does not, still opens
  a complete strip. Decided by `resolveSettingsTabOrder.util.test.ts` → "drops a
  name that is not a tab of either drawer" and "keeps the stored order and
  appends what it did not name", and by `TableSettingsDrawerBody.test.tsx` →
  "ignores a stored order naming a tab the drawer does not have".
- Both the order and the width survive a reload, through the same UI-flags cookie
  as the selected tab. Decided by `getPersistedUiState.util.ts`, which carries
  `settingsTabOrder` and `settingsPanelWidth`, and by the round trip
  `readPersistedUiFlagsFromCookie` closes into the loader's `metaState`.

## Notes

The order now has two homes and they do not merge. A table's own order lives in
the UI-flags cookie keyed by `persistenceKey`, the same scope the selected tab
and the pinned state already have; the reader's default lives in the
global-settings cookie under `tablePanel.settingsTabOrder`. The loader reads the
first and falls back to the second, so a per-table drag wins and a reader who
has dragged nowhere gets their default everywhere. What that leaves is a table
carrying an order the reader cannot see a way back from — there is no control
that clears a table's order back to the global one. ADR-115 records that as a
known cost rather than an oversight.

The `command` pointer was checked rather than assumed. Dropping the fallback in
`readTableLoaderStateFromRequest` — reading `metaUiFlags.settingsTabOrder`
alone — fails "starts a table that stored no order from the global preference"
and only that one; the two precedence cases stay green, which is what says they
pin the ordering rather than the channel's existence. The run is on
[#1118](https://github.com/luciocabrera/lcabrera-stack/issues/1118).
