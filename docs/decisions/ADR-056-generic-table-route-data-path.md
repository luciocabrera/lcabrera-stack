# ADR-056 — One generic data path for a paginated table route

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** `@lcabrera/api` (`http/`), `@lcabrera/ui` (`routing/shared`, `hooks`, `components/TableRouteView`), the three paginated table routes in `apps/react-router`
- **Issue:** #490
- **Related:** ADR-008 (primary-key sort tiebreaker), ADR-009 (serializable fetch descriptors), ADR-038 (public package topology by runtime), ADR-052 (keyset cursor)

## Context

`createTableRouteLoader` already generalised the **loader** half of a paginated
table route. The **client** half was never generalised, so three routes —
`enterprise-orders`, `car-sales-infinite`, `wide-alltypes-150` — each wrote:

1. a browser fetcher that built query params, concatenated a URL, fetched and
   checked the response;
2. the `sanitizeSorting` → `appendPrimaryKeySorting` composition, re-derived on
   the client;
3. a `useLoaderData` → `TableLayout` component with the same six props and the
   same two selectors.

Point 2 is not incidental. `createTableRouteLoader` deliberately stores only the
_user's_ sorting in `columnsState` and appends the primary-key tiebreaker
(ADR-008) for the server query alone. Any load-more must therefore reproduce
that composition exactly, or the second page is ordered differently from the
first. Three hand-written copies of a correctness-critical composition is three
chances to get it wrong, and nothing would have failed loudly if one had.

The three copies had also drifted in rigour. `carSales` and `wideAlltypes150`
validated through `fetchAndValidate` with a type guard; `fetchOrdersPage` did a
raw `fetch` with `!response.ok` and an unchecked `as` cast — so the one route
reading its own Postgres-backed resource route was the one with no runtime
check on the payload.

## Decision

Extract one generic per layer, each into the package that owns that concern.

### 1. `createPaginatedFetcher` — `@lcabrera/api/http`

A factory: endpoint declaration in, fetcher out. It composes the two primitives
already in that folder (`buildPaginatedQueryParams`, `fetchAndValidate`) and adds
no HTTP behaviour of its own.

The response guard is **required**. An unvalidated page is a cast, and a wrong
cast surfaces as a render crash several layers from the response that caused it.
This is what closes the `fetchOrdersPage` gap rather than preserving it.

Origin resolution is a per-fetcher `resolveBaseUrl` strategy taking the optional
SSR request URL — `getApiBaseUrl` for an endpoint on the API host, omitted for a
same-origin resource route. That one axis is the only real difference between
the app's BFF fetchers and its resource-route fetcher.

### 2. `buildTablePageQuery` + `toKeysetCursorValues` — `@lcabrera/ui/routing/shared`

They sit beside `sanitizeSorting` and `appendPrimaryKeySorting`, which they
compose, and they must live in `ui` rather than `api`: they consume the Table's
`TableColumn` / `SortingState` / `ColumnFiltersState` types, and ADR-038 fixes
the dependency direction as `ui → api`.

`buildTablePageQuery` is the client-side mirror of what the loader factory does
server-side, so the two halves now compose the same utils in the same order by
construction.

### 3. `useTableRoutePage` + `TableRouteView` — `@lcabrera/ui`

The hook reads `useLoaderData<TableRouteLoaderData<…>>()` and returns the four
props `TableLayout` needs. `TableRouteView` is a thin shell over it that adds
the two default selectors. Both are exported: the component for the common case,
the hook for a route that needs its own JSX around the table.

`TableRouteLoaderData` is **derived** from `createTableRouteLoader`
(`ReturnType<ReturnType<typeof …>>`) rather than restated, so the view side
cannot drift from what the loader actually returns.

A `packages/ui` component reading loader data is not a new dependency direction
— `AppProviders` already does — and `react-router` is already a peer dependency.

### 4. `filter` and `cursor` are opt-in, defaulting to off

Two `is*` boolean props, both `false` by default.

This is the load-bearing decision. Only the enterprise-orders endpoint
understands `filter` and `cursor`: `carSales.schema.ts` parses sorting and
nothing else, and neither sibling loader forwards `filters` to its `fetchPage`.
Sending a `cursor` to an offset-only endpoint is merely noise, but sending a
`filter` to an endpoint that ignores it is a **correctness bug** — the table
appends unfiltered rows to a filtered view. Defaulting both off means adopting
the generic cannot change a route's request shape by accident; a route opts in
once it has a server that implements the capability.

## Consequences

- A fourth paginated table route is a loader, a columns constant and a fetcher
  declaration. No fetch plumbing, no sort composition, no table JSX.
- The two sibling routes' request shapes are unchanged, by construction.
- `enterprise-orders` gains the runtime response validation it lacked.
- `@lcabrera/api` and `@lcabrera/ui` both grow public surface, so this carries a
  changeset and an `api-surface` snapshot update.
- `TableRouteView` constrains `TResponse extends TablePageResponse<TData>` so the
  selectors can default. A response shaped differently uses `useTableRoutePage`
  with `TableLayout` directly — the escape hatch is why the hook is exported.
- Deriving `TableRouteLoaderData` from the factory surfaced a latent looseness:
  `readTableLoaderStateFromRequest` cast `columnOrder` / `columnVisibility` to
  `keyof TData` while every sibling cast used the proper state type. Both now use
  `ColumnOrderState` / `ColumnVisibilityState`.

## Alternatives considered

**Leave it as three copies.** The duplication is small per file, which is exactly
why it survived. What makes it worth removing is not line count but that item 2
is a correctness invariant shared with the loader, expressed three times in
prose-equivalent form.

**Put the query builder in `@lcabrera/api`.** Rejected: it would force `api` to
depend on the Table's types, inverting ADR-038's direction.

**Make the response guard optional.** Rejected: an optional validator that
silently casts when omitted is a footgun in a published package, and the one
existing call site without a guard is the one this ADR set out to fix.

**Infer the two capabilities instead of declaring them.** There is nothing
client-side to infer them from — capability is a property of the endpoint, which
only the route knows. Defaulting them off makes the safe choice the silent one.
