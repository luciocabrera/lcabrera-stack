---
'@lcabrera/ui': minor
---

The table settings panel gains an **Advanced** tab, and the General tab goes back
to being one thing. General now holds a clear and a reset for each part of the
table's query state and nothing else, including the Grouping pair it was missing;
that pair renders only where the route declared `isGroupingEnabled`. Totals
position and the tab-order drag move out of it, and the totals mode moves out of
the Grouping tab, so Grouping is dimensions and measures. All three now sit in
Advanced, which is last in the declared order and always present, since the tab
order applies to a table whether or not it groups.

`TableSettingsTabRole` gains `'advanced'`. If you narrow that union or switch
exhaustively over it, this is the change to look at. A tab order stored before
this release is read the same way as any other partial one: `advanced` is
appended at the end rather than the tab going missing. The column settings drawer
maps no key onto the role and does not paint the tab.

A reader can now state a default tab order once instead of per table. The
Settings page gains a **Table Panel** tab holding the same drag list, staged in
the settings draft and written to `tablePanel.settingsTabOrder` in the
global-settings cookie on Accept. A table that stored no order of its own opens
in it; a table whose UI-flags cookie carries an order keeps that one, so the
global value is a default rather than an override. `GlobalSettingsState` gains a
`tablePanel` key. The cookie version is unchanged, because a payload written
without the key still parses.

A draggable row's label truncates with an ellipsis rather than wrapping, and
carries the full text in `title`. Two lines in one row changed that row's height
while it was being dragged past, which the grouping panel's longer measure labels
did routinely.

`GroupingModeSection`, `TotalsPlacementSection` and `TabsOrderSection` moved to
`TableSettingsDrawer/AdvancedSettingsSection/`. None of their `*.stylex.ts`
modules calls `defineVars`, so no custom property was renamed and a `createTheme`
cannot drift on this.
