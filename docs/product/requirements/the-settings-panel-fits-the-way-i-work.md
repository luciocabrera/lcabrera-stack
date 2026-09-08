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
    ref: packages/ui/src/components/Table/TableSettingsDrawer/GeneralSettingsSection/TabsOrderSection/TabsOrderSection.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/utils/orderSettingsTabs.util.test.ts
  - type: code
    ref: packages/ui/src/components/SidePanel/SidePanelResizeHandle/SidePanelResizeHandle.component.tsx
  - type: doc
    ref: docs/decisions/ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md
---

# The settings panel fits the way I work

## Statement

I spend the day in one or two tabs of the table settings and I reach past the
rest every time. The panel should let me put the tab I use first, and it should
be as wide as the work needs — the column list and the filter editors do not fit
in a fixed strip on a display with room to spare. What I set should still be
there tomorrow, and it should never leave the panel wider than the screen I open
it on.

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
- The General tab lists every settings tab and a drop states the whole order, not
  the tab that moved. Decided by `TabsOrderSection.test.tsx` → "states a drop as
  the whole order, not the moved tab alone".
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

The order is per table, because the cookie is keyed by the table's
`persistenceKey` — the same scope the selected tab and the pinned state already
have. A reader who wants one order everywhere sets it per table today; making it
an account-wide preference would mean moving it to the global settings cookie,
which is a different decision and not one this requirement asks for.
