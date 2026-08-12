# Routing Utilities Architecture

Route-side server code shared by the React Router apps: the pure helpers a
route's loader/action composes to read persisted table state, sanitize
URL-provided input, decorate columns, and persist cookies. Everything here is
SSR-safe; the utils are pure and the one action (`actions/persist-cookie.action`)
is a designated side-effect home.

The folder is split by concern:

- **`loaders/`** — loader-side composition. `createTableRouteLoader` is the
  headline: a route wires config plus a `fetchPage` callback and gets a complete
  `loader` back, the loader-side counterpart to the generic persist-cookie
  action. The other loader utils are the building blocks it composes.
- **`actions/`** — the `/_action/persist-cookie` action and its pure helpers,
  plus the `shouldRevalidate` skip and the shared `PersistCookieEntry` submit
  shape.
- **`shared/`** — utils used by both loaders and route **components** (the
  `onLoadMore` handlers reuse the sorting helpers), so they live apart from the
  loader-only code.

## `loaders/`

| File                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTableRouteLoader.util.ts`          | Factory: builds a table route's `loader` from config + a `fetchPage` callback — reads state, sanitizes sorting, appends the primary-key tiebreaker, optionally bakes distinct descriptors, and assembles the serializable `columnsState` / `metaState`. Returns the fetch promise unawaited for Suspense streaming — a navigation re-runs the loader, so `use()` re-suspends on the new promise and nothing has to key the boundary. |
| `readTableLoaderStateFromRequest.util.ts` | Reads shared table loader state from URL + cookies                                                                                                                                                                                                                                                                                                                                                                                   |
| `appendDistinctFilterDescriptors.util.ts` | Attaches serializable `kind: 'distinct'` filter-option descriptors (ADR-009) to filterable string columns without one                                                                                                                                                                                                                                                                                                                |

## `actions/`

| File                                          | Description                                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `persist-cookie.action.ts`                    | Action behind `/_action/persist-cookie` (Set-Cookie persistence)                                                        |
| `buildSetCookieHeaders.util.ts`               | Pure: builds a fresh `Headers` with one `Set-Cookie` per entry that has both key and value (reuses `buildCookieString`) |
| `applySearchParamUpdates.util.ts`             | Pure: applies search-param updates to a `URLSearchParams` (empty value deletes), returns the next params + change flag  |
| `buildPersistCookieEntry.util.ts`             | Pure builder for a cookie-only `/_action/persist-cookie` entry                                                          |
| `isPersistCookieAction.util.ts`               | Matches a request path against `PERSIST_COOKIE_ACTION`                                                                  |
| `shouldRevalidatePersistCookieAction.util.ts` | `shouldRevalidate` helper that skips revalidation for cookie-persist submissions                                        |
| `routing.types.ts`                            | The shared `PersistCookieEntry` client-submit shape                                                                     |

## `shared/`

| File                                   | Description                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `sanitizeSorting.util.ts`              | Drops invalid/actions-column sort entries                                                                       |
| `appendPrimaryKeySorting.util.ts`      | Appends the primary-key tiebreaker to a sort list for stable pagination (ADR-008)                               |
| `toQuerySort.util.ts`                  | Renames a sanitized sorting to the `{ column, direction }` shape an endpoint's ORDER BY takes                   |
| `toKeysetCursorValues.util.ts`         | Reads the sort-key tuple out of the last loaded row, in sorting order — the keyset cursor (ADR-052)             |
| `buildTablePageQuery.util.ts`          | Turns the table's columns state into the next page's query — the client-side mirror of `createTableRouteLoader` |
| `sanitizeFiltersByColumns.util.ts`     | Drops URL filters that don't match a known column                                                               |
| `isFilterCompatibleWithColumn.util.ts` | Guard used when sanitizing URL filters against column definitions                                               |
| `getRootLoaderData.util.ts`            | Typed access to the root route's loader data                                                                    |

## Serialization Contract (ADR-009)

Everything a loader returns must be serializable — single-fetch silently
turns functions into `undefined` on the client. `createTableRouteLoader` returns
only plain state plus the unawaited fetch promise, and
`appendDistinctFilterDescriptors` is the loader-side half of the descriptor
system: it bakes concrete params (`columnName` = `column.key`, schema/table from
route config, transport from app choice) into plain JSON that the client tool
(`utils/filters/resolveFilterOptionsDescriptor`) executes. It works identically
for hardcoded column constants and future DB-introspected columns.
