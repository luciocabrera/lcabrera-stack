---
'@lcabrera/ui': minor
---

The table settings panel gains an **Advanced** tab, and the General tab goes back
to being one thing. General holds a clear and a reset for each part of the
table's query state and nothing else, including the Grouping pair it was missing;
that pair renders only where the route declared `isGroupingEnabled`. Totals
position leaves General and the totals mode leaves the Grouping tab, so Grouping
is dimensions and measures. Both land in Advanced, which is registered only where it
has something to render: each of its two controls carries its own guard, so a
locked preset outside `rollup` would otherwise paint an empty tab. The General
tab's Grouping heading is gated the same way, since `GroupingSectionToolbar`
renders nothing under a locked preset.

**The settings tab order is now a global preference and no longer a per-table
one.** The Settings page gains a **Table Panel** tab holding the drag list,
written to `tablePanel.settingsTabOrder` in the global-settings cookie on Accept.
The drag inside the table drawer is gone, along with `useSetTableSettingsTabOrder`
and the `settingsTabOrder` entry in the per-table UI-flags cookie. Which order the
tabs sit in is the same answer on every table, so it belongs beside the navigation
size and the pin-side default rather than beside the filters. A reader who
arranged one table's tabs in the previous release gets the declared order back
until they set one on the Settings page; one action then covers every table. The
stale key is dropped on read: `readPersistedUiFlagsFromCookie` now narrows the
parsed payload to the keys `PersistedUiState` declares, because
`parseVersionedPayload` casts rather than checks and a key removed from that type
was still reaching the meta store.

`TableSettingsTabRole` gains `'advanced'`. If you narrow that union or switch
exhaustively over it, this is the change to look at. An order stored before this
release is read the same way as any other partial one: `advanced` is appended at
the end rather than the tab going missing. The column settings drawer maps no key
onto the role and does not paint the tab.

`GlobalSettingsState` gains a `tablePanel` key. The cookie version is unchanged,
because a payload written without the key still parses.

`createTableRouteLoader`'s `metaState` now always carries `settingsTabOrder`,
where it previously carried the key only when a value existed. The value is still
`undefined` when the reader has set no order, and `TableMetaState` still declares
the property optional, so this widens what the loader guarantees rather than
narrowing what the Table accepts.

A draggable row's label truncates with an ellipsis rather than wrapping, and
carries the full text in `title`. Two lines in one row changed that row's height
while it was being dragged past, which the grouping panel's longer measure labels
did routinely.

`GroupingModeSection` and `TotalsPlacementSection` moved to
`TableSettingsDrawer/AdvancedSettingsSection/`. Neither of their `*.stylex.ts`
modules calls `defineVars`, so no custom property was renamed and a `createTheme`
cannot drift on this.
