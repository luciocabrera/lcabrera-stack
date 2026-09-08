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
once and have every table I open follow it, because it is the same answer every
time and I do not want to repeat it per table. What I set should still be there
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
- Settings carries a Table Panel tab listing every settings tab, and Accept
  persists the order the reader arranged as a whole rather than the tab that
  moved. Decided by `Settings.component.test.tsx` → "persists the settings tab
  order from the Table Panel tab".
- Every table opens in that one order, and no table carries an order of its own.
  Decided by `readTableLoaderStateFromRequest.util.test.ts` → "takes the order
  the reader set globally", "reads no order out of the table UI-flags cookie" and
  "states no order when the reader has set none".
- Arranging the tabs to the declared order clears the preference rather than
  storing it. Decided by `toGlobalTablePanelPreferencesUpdate.util.test.ts` →
  "writes the order back to undefined when it is the declared one".
- The General tab holds the clear and the reset for each part of the table's
  query state, including grouping, and holds nothing that writes a search param.
  Decided by `GeneralSettingsSection.test.tsx` → "composes width presets, section
  toolbars, and all-settings actions" and "offers no grouping actions for a route
  that cannot group".
- The Advanced tab carries the two totals controls, and is absent on a table that
  cannot group rather than opening empty. Decided by
  `AdvancedSettingsSection.test.tsx` → "composes the two totals controls", and by
  `TableSettingsDrawerBody.test.tsx` → "offers no Advanced tab for a route that
  cannot group".
- That one order governs both the table settings tabs and a single column's tabs,
  matching them by what each tab is for rather than by its name. Decided by
  `orderSettingsTabs.util.test.ts` → "ranks a column drawer tab by the role it
  fills".
- An order stored before a tab existed, or naming one that does not, still opens
  a complete strip. Decided by `resolveSettingsTabOrder.util.test.ts` → "drops a
  name that is not a tab of either drawer" and "keeps the stored order and
  appends what it did not name", and by `TableSettingsDrawerBody.test.tsx` →
  "ignores a stored order naming a tab the drawer does not have".
- The width survives a reload through the same UI-flags cookie as the selected
  tab. Decided by `getPersistedUiState.util.ts`, which carries
  `settingsPanelWidth`, and by the round trip `readPersistedUiFlagsFromCookie`
  closes into the loader's `metaState`.
- The order survives a reload through the global-settings cookie. Decided by
  `toGlobalTablePanelPreferences.util.test.ts` → "keeps a stored order and
  appends the roles it did not name" and "drops a name that is not a role".

## Notes

The order has exactly one home, and that is the point. It was per table when
ADR-114 introduced it, keyed by `persistenceKey` like the selected tab and the
pinned state. Those are answers about the table in front of you; which order the
tabs sit in is not. Keeping both scopes was tried and produced a table whose own
order won for good with no control to clear it, so ADR-115 dropped the per-table
form rather than adding a third control to undo the second.

The cost is that the order is read in the loader, so changing it on the Settings
page shows up on the next table opened rather than in a drawer already on screen.

The `command` pointer was checked rather than assumed. Replacing the read in
`readTableLoaderStateFromRequest` with `undefined` fails "takes the order the
reader set globally" and only that one; "reads no order out of the table
UI-flags cookie" and "states no order when the reader has set none" stay green,
which is what says they pin the channel rather than the value. The run is on
[#1118](https://github.com/luciocabrera/lcabrera-stack/issues/1118).
