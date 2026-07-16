# Routing Utilities Architecture

Loader/action-side utilities shared by the React Router apps: pure helpers a
route's server code composes to read persisted table state, sanitize
URL-provided input, and decorate columns before returning loader data. All
utils here are pure and SSR-safe; the one action (`persistCookie.action`) is
a designated side-effect home.

## Files

| File                                          | Description                                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `appendDistinctFilterDescriptors.util.ts`     | Attaches serializable `kind: 'distinct'` filter-option descriptors (ADR-009) to filterable string columns without one   |
| `appendPrimaryKeySorting.util.ts`             | Appends the primary-key tiebreaker to a sort list for stable pagination (ADR-008)                                       |
| `applySearchParamUpdates.util.ts`             | Pure: applies search-param updates to a `URLSearchParams` (empty value deletes), returns the next params + change flag  |
| `buildSetCookieHeaders.util.ts`               | Pure: builds a fresh `Headers` with one `Set-Cookie` per entry that has both key and value (reuses `buildCookieString`) |
| `getRootLoaderData.util.ts`                   | Typed access to the root route's loader data                                                                            |
| `isFilterCompatibleWithColumn.util.ts`        | Guard used when sanitizing URL filters against column definitions                                                       |
| `isPersistCookieAction.util.ts`               | Matches a request path against `PERSIST_COOKIE_ACTION`                                                                  |
| `persistCookie.action.ts`                     | Action behind `/_action/persist-cookie` (Set-Cookie persistence)                                                        |
| `readTableLoaderStateFromRequest.util.ts`     | Reads shared table loader state from URL + cookies                                                                      |
| `sanitizeFiltersByColumns.util.ts`            | Drops URL filters that don't match a known column                                                                       |
| `sanitizeSorting.util.ts`                     | Drops invalid/actions-column sort entries                                                                               |
| `shouldRevalidatePersistCookieAction.util.ts` | `shouldRevalidate` helper that skips revalidation for cookie-persist submissions                                        |

## Serialization Contract (ADR-009)

Everything a loader returns must be serializable — single-fetch silently
turns functions into `undefined` on the client. `appendDistinctFilterDescriptors`
is the loader-side half of the descriptor system: it bakes concrete params
(`columnName` = `column.key`, schema/table from route config, transport from
app choice) into plain JSON that the client tool
(`utils/filters/resolveFilterOptionsDescriptor`) executes. It works
identically for hardcoded column constants and future DB-introspected
columns.
