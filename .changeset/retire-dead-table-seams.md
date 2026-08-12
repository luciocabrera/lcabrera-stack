---
'@lcabrera/ui': minor
---

Retire four table seams that were wired to nothing.

Each was a reader with no writer, a knob with nothing to configure, or a helper
with no caller — and each sat somewhere a reader would reasonably take for the
intended home of new table state. Removing them is cheaper than keeping them
plausible.

**The `<persistenceKey>-tableState` URL param is gone.** `createTableRouteLoader`
(via `readTableLoaderStateFromRequest`) decoded a Base64 envelope from that param
and let its `columnOrder` / `columnVisibility` win over the cookie. Nothing wrote
it: the persist-cookie flow (ADR-010) gives those two slices no `searchParamKey`,
and the encoder that could produce the envelope was never part of the package's
`exports`. Column order and visibility now come from the cookie only, which is
the channel that has always written them, and `sorting` / `filters` remain the
URL-borne slices they already were. **Breaking if you hand-wrote that param** —
there was no supported way to produce it, and the loader now ignores it.

**`columnOverscan` is gone from `TableMetaState`**, along with the
`DEFAULT_COLUMN_OVERSCAN` constant on `./components/Table/Table.constants` and
the matching `getInitialMetaState` option. The table virtualizes rows, not
columns; every column in view is rendered, so an overscan count for them
configured nothing. **Breaking if you set it** — the field is a compile error
naming itself, and there is no replacement, because there was never a behaviour
behind it. Row overscan (`overscan` / `DEFAULT_OVERSCAN`) is untouched.

**Three column selectors and one meta selector are gone** —
`useGetEffectiveColumns`, `useGetNormalizedColumnFilters`,
`useGetStaticColumnKeys` and `useGetTableColumnOverscan`. None was reachable from
outside the package: the selector barrels never exported them and no `exports`
subpath reaches them. The state they read is untouched, so a selector can be
reintroduced the day something renders from it.

**The `getTotalVisibleColumnCount` helper is gone.** It computed a spacer-row
`colSpan`; `SpacerRow` derives that itself from `useGetPinnedColumnPartition`.
It was module-internal and had no `exports` subpath.
