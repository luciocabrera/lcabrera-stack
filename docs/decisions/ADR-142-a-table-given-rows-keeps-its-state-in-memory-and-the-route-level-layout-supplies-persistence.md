---
governs:
  - ui
---

# ADR-142 — A Table given rows keeps its state in memory, and the route-level layout supplies persistence

**Status:** Accepted

**Issue:** [#994](https://github.com/luciocabrera/lcabrera-stack/issues/994), with [#995](https://github.com/luciocabrera/lcabrera-stack/issues/995) folded into it

**Relates to:** [ADR-010](ADR-010-cookie-persistence-server-action.md) (cookie persistence goes through a server action)

## Context

`Table` read its columns and configuration from providers that only
`TableLayout` or a second component, `StaticTable`, mounted. It took a resolved
`response` and a `dataSelector`, never rows, so drawing an array of rows meant
assembling a provider stack by hand.

Every action that changes grid state persisted through `usePersistCookieAction`,
which calls the router's `useFetcher`. The grid shell also held the persistence
fetchers open with `useFetcher`. Both throw outside a data router, so a grid
rendered without one failed on its first render. Inside a router the grid
submitted each change to `/_action/persist-cookie` and waited for a loader to
apply it. A grid whose rows were already in hand had no loader, so a sort was
written to the URL and the rows kept their order.

## Decision

- `Table` takes either `response` or `rows`. Given `rows`, it sorts and filters
  them in memory from the columns store's sorting and filter state
  (`useTableDataState`, `deriveLocalRows`). The filter matchers read a filter
  the way the server's query filters read it.
- When no `TableConfigContext` sits above it, `Table` renders itself inside its
  own `TableConfigProvider`, `TableFocusProvider` and `FiltersDataProvider`. It
  also adds a `GlobalSettingsProvider` and a `NotificationProvider` when those
  are missing, because the settings panel and the notify actions read them.
  Columns come from `columns`, or from `inferTableColumnsFromJson` over the
  rows.
- Persistence is a context, `TablePersistenceContext`, holding one cookie
  submitter each for table state, column sizing and UI flags. `TableLayout`,
  the route-level entry, builds them with `useTablePersistence` and provides
  them. The persist-action hooks read the context. Without it they apply the
  change in memory and submit nothing, and the empty state offers no Retry,
  because no route loader exists to revalidate.
- `StaticTable` is removed. Its callers render `Table`.
- `react-router` stays a required peer. The package's modules import it
  unconditionally, and the shell, route views, `Form`, `NavLink` and
  `TableLayout` need a data router mounted. A `Table` given rows does not.

## Consequences

- A `Table` given rows inside a router persists nothing, even with a
  `/_action/persist-cookie` route mounted. Its state lasts as long as the
  component does. That is deliberate: no loader reads the cookie back for rows
  held in memory, so a write would change the URL and nothing else.
- The persist-action hooks now depend on a provider rather than on the router.
  A new caller that mounts `TableConfigProvider` directly and wants persistence
  has to provide `TablePersistenceContext` itself.
- In-memory filtering mirrors the server's query filters by hand. A new filter
  operator has to be added in both places, and nothing checks that they agree.
- The persist-hook unit tests mount the layout's persistence through
  `TablePersistenceWrapper`. Their assertions did not change.

## Alternatives considered

- **Detect a data router and skip `useFetcher` when there is none.** Rejected:
  the detection needs `UNSAFE_DataRouterContext`, and a hook cannot be called
  conditionally. The persist hooks would have to call `useFetcher` on some
  renders and not others, which the hooks lint and the React Compiler both
  refuse.
- **Mount a memory router inside `Table` when none is present.** Rejected: it
  wraps the grid in a router whose persistence goes nowhere, it throws inside a
  declarative `<BrowserRouter>`, and it needs a route element that renders the
  table's children.
- **Keep `StaticTable` and export it.** This was #1502. Rejected by the
  issue's amended scope: a second table component that only mounts providers
  duplicates what `Table` can do itself.

## References

- [#994](https://github.com/luciocabrera/lcabrera-stack/issues/994), [#995](https://github.com/luciocabrera/lcabrera-stack/issues/995), [#1502](https://github.com/luciocabrera/lcabrera-stack/pull/1502)
- `docs/product/requirements/render-a-table-from-rows-alone.md`
- `docs/product/requirements/use-the-grid-without-a-router.md`
