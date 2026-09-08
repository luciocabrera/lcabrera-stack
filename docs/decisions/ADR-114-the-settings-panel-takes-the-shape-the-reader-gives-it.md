---
governs:
  - ui
---

# ADR-114 — The settings panel takes the shape the reader gives it

**Status:** Accepted

## Context

Both settings drawers are one `SidePanel` at a fixed `size='md'` (26rem) with a
fixed tab strip. Two things follow from that, and both were reported from use:

- **The tabs are in the order they were written in.** The table drawer read
  General, Filters, Sorting, Grouping, Columns; the column drawer read General,
  Filter, Sorting, Pinning, Details. Neither order was decided, and the two
  disagree about where the column-shaped tab sits. A reader who lives in one tab
  reaches past the others every time — and the strip already scrolls
  ([ADR-106](./ADR-106-a-tab-strip-that-does-not-fit-scrolls.md)), so a tab can sit
  off-screen.
- **The width is the package's choice, not the reader's.** 26rem fits the toolbars
  and is tight for the Columns list and the filter editors, on a display that has
  room to spare.

The drawers already persist reader-owned state — which tab is selected, whether the
panel is pinned, which filter sections are expanded — in the UI-flags cookie, keyed
by the table's `persistenceKey`. So the question was not whether this state has a
home, but whether these two things belong in it.

## Decision

**One tab order governs both drawers, stated in roles rather than in tab keys.**
`TABLE_SETTINGS_TAB_ROLES` is `general, columns, filters, sorting, grouping,
details` — the declared order, and the default. `TABLE_SETTINGS_TAB_ROLE_BY_KEY`
maps each drawer's own tab keys onto it, so the column drawer's `pinning` fills the
`columns` role and its `filter` fills `filters`. `orderSettingsTabs` ranks a
drawer's tabs by that order; a tab filling no known role sorts to the end, keeping
the order it was given.

**The reader states the order by dragging it, in the General tab.**
`TabsOrderSection` is a `DraggableList` of the six roles. A drop writes the whole
order, not the moved role, through `useSetTableSettingsTabOrder` — into the meta
store and the UI-flags cookie in the same call, like the selected tab. It is not
part of the drawer's Accept/Cancel draft: this is the shape of the panel, not a
setting the panel is editing.

**A stored order is sanitised on read, never on write.** `resolveSettingsTabOrder`
drops a name that is not a role, states a repeat once, and appends every role the
stored order did not name, in the declared order. A cookie written by an older or
newer version therefore degrades to a partial preference rather than to a missing
tab.

**The panel resizes from its inner edge, within a band it owns.**
`SidePanel` takes `isResizable`, `width`, `onWidthChange` and `onWidthCommit`;
`SidePanelResizeHandle` is the ARIA window-splitter, focusable, carrying
`aria-valuenow`/`min`/`max`, driven by pointer and by arrow keys plus Home/End. The
band is `SIDE_PANEL_MIN_WIDTH` (320px) to `SIDE_PANEL_MAX_WIDTH_RATIO` (90%) of the
viewport, enforced twice: in the gesture, and again in CSS as
`max(320px, min(<width>px, 90vw))`, so a width persisted on a wide display cannot
paint off the edge of a narrow one.

**The drag and the commit are separate calls, and the Table decides what each
means.** `onWidthChange` runs per animation frame and writes the meta store only;
`onWidthCommit` runs once the gesture ends and writes the cookie — the split
`useSetColumnSizingWithoutSync`/`useSyncColumnsSizing` already draws for a column.
Both drawers share one `settingsPanelWidth`, because they are one panel to the
reader.

**Totals position moves to the General tab.** It was staged beside the grouping
mode while committing somewhere else entirely — its own draft store, the `totals`
param and the UI-flags cookie ([ADR-085](./ADR-085-a-preset-makes-ungrouped-a-real-state.md)).
It still renders only under `rollup`, where there is something to position.

## Consequences

**The tab order is per table, and shared by the two drawers.** A reader who orders
one table's tabs has not ordered another's — the cookie is keyed by
`persistenceKey` — and cannot order the column drawer differently from the table
drawer. Both are deliberate: the first is how every other drawer preference already
behaves, and the second is what makes one drag answer for both strips.

**A role is now a thing that can be added wrongly.** A new tab that names no role
sorts to the end and cannot be dragged, silently. The map is the place to look, and
`orderSettingsTabs.util.test.ts` pins the fallback so the failure is at least
defined.

**The panel's width outlives the session but not the device.** It is a cookie, so a
width chosen on a desktop follows the reader to a phone, where the CSS ceiling
clamps it to 90vw rather than the number they picked. That is the right failure —
it is visible and self-correcting — but the number in the cookie stops matching the
panel on screen.

**`useViewportWidth` reads the viewport during render, through
`useSyncExternalStore`.** The splitter has to announce `aria-valuemax`, which
depends on the viewport, and React Doctor blocks a bare `window` read in a hook
body. The server snapshot is `0`, which resolves the band to its floor for the
markup, and the first client render replaces it.

## Alternatives considered

1. **Two stored orders, one per drawer.** Rejected: the drawers hold the same six
   concerns and a reader who moves Details to the front means it in both. Two
   orders is two things to keep in step, and the second one nobody would set.
2. **Order by tab key rather than by role.** Rejected on the evidence that the keys
   already disagree — `filter` against `filters`, `pinning` against `columns`. A key
   order would leave the column drawer unorderable for four of its five tabs.
3. **Stage the order in the drawer's draft, behind Accept.** Rejected: the reader is
   arranging the panel they are looking at, and a drag that does nothing until
   Accept reads as a broken drag. The pin toggle and the selected tab already commit
   immediately for the same reason.
4. **A `size` prop the app sets, instead of a drag.** Rejected: it moves the choice
   to the consumer, and the reported problem is that the choice was not the
   reader's.
5. **Persist the width per drawer.** Rejected: they occupy the same edge of the
   screen and are never both open, so two widths would make the panel jump when the
   reader moves between them.

## References

- [ADR-085](./ADR-085-a-preset-makes-ungrouped-a-real-state.md) — where totals placement commits
- [ADR-106](./ADR-106-a-tab-strip-that-does-not-fit-scrolls.md) — the scrolling strip this orders
- [#1113](https://github.com/luciocabrera/lcabrera-stack/issues/1113)
