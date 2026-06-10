# Artifact Inventory

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

---

## Components

| Component                            | Location                                               | Description                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `AppNavigation`                      | `components/AppNavigation/`                            | App-owned left sidebar navigation using `SidePanel`, `Toolbar`, route item constants, compact/full modes, and pin/unpin controls  |
| `Button`                             | `components/Button/`                                   | Interactive button — 8 color variants, 5 sizes, icon, loading, tooltip                                                            |
| `Card`                               | `components/Card/`                                     | Container with elevation, color, padding, and optional interactivity                                                              |
| `DevStyleXInject`                    | `components/DevStyleXInject/`                          | Dev-only StyleX CSS injector for HMR; must be at app root                                                                         |
| `DraggableList`                      | `components/DraggableList/`                            | Drag-and-drop reorderable list using native drag events                                                                           |
| `Icons`                              | `components/Icons/`                                    | 32 SVG icon components (see `Icons/index.ts` for full list)                                                                       |
| `InfoBox`                            | `components/InfoBox/`                                  | Styled container for informational messages and empty states                                                                      |
| `Modal`                              | `components/Modal/`                                    | Native `<dialog>` modal with title, footer, Esc-to-close                                                                          |
| `NavLink`                            | `components/NavLink/`                                  | Router-aware navigation link with color, size, icon, orientation                                                                  |
| `NotificationCenter`                 | `components/NotificationCenter/`                       | Global corner-based notification viewport with dismiss + auto-hide using NotificationContext, local constants, and view utilities |
| `PinSideModal`                       | `components/PinSideModal/`                             | Modal for choosing column pin side (left / right / closest-edge)                                                                  |
| `RadioOptionGroup`                   | `components/RadioOptionGroup/`                         | Generic `<TValue extends string>` radio button group                                                                              |
| `RouteErrorBoundary`                 | `components/RouteErrorBoundary/`                       | Shared route error boundary display with retry button; accepts `defaultMessage` and `error` props                                 |
| `SidePanel`                          | `components/SidePanel/`                                | Off-canvas panel with 10 sub-components, pinning, portal support                                                                  |
| `Table`                              | `components/Table/`                                    | Full-featured data table — sort, filter, pin, resize, virtualise, persist, opt-in prefetch (ADR-006)                              |
| `TableSettingsDrawer/DetailsSection` | `components/Table/TableSettingsDrawer/DetailsSection/` | Read-only details panel inside table settings showing required counts plus optional metadata                                      |
| `TableBodyRows`                      | `components/Table/TableBodyRows/`                      | Row-rendering delegate for TableBody — owns the visible-row loop and cell creation via utility reuse                              |
| `Tabs`                               | `components/Tabs/`                                     | Keyboard-navigable tab bar using React 19 `<Activity>`                                                                            |
| `Tag`                                | `components/Tag/`                                      | Label chip with optional remove button                                                                                            |
| `ToggleSwitch`                       | `components/ToggleSwitch/`                             | Accessible boolean toggle (controlled, `role="switch"`)                                                                           |
| `Toolbar`                            | `components/Toolbar/`                                  | Horizontal/vertical toolbar of Button/NavLink items                                                                               |
| `Tooltip`                            | `components/Tooltip/`                                  | CSS Anchor + Popover API tooltip, 4 placements, animated                                                                          |
| `VirtualList`                        | `components/VirtualList/`                              | Virtualized list with search, select-all, checkboxes, lazy load, parent-contained sizing                                          |
| `VirtualSelect`                      | `components/VirtualSelect/`                            | Parent-contained dropdown select backed by `VirtualList`; `string[]` or `{ label, value }[]` options                              |

---

## Hooks

| Hook                              | Location                                        | Description                                                                                                   |
| --------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `useClickOutside`                 | `hooks/useClickOutside.hook.ts`                 | Fires callback when a `mousedown` occurs outside a given ref                                                  |
| `useStore`                        | `hooks/useStore.hook.ts`                        | Ref-based external store with shallow-equality guard, subscribe, reset, SSR snapshot                          |
| `useNotifications`                | `hooks/useNotifications.hook.ts`                | Accesses NotificationContext actions/state (`notify`, `dismissNotification`, `dismissNotifications`)          |
| `useTheme`                        | `hooks/useTheme.hook.ts`                        | Returns `{ theme, setTheme }` from `ThemeContext` via React 19 `use()`                                        |
| `useColumnVirtualization`         | `hooks/useColumnVirtualization.hook.ts`         | Computes `startIndex`, `endIndex`, `leftSpacerWidth`, `rightSpacerWidth` for horizontal column virtualisation |
| `useVirtualization`               | `hooks/useVirtualization.hook.ts`               | Computes `startIndex`, `endIndex`, `totalHeight`, `offsetY` for a scrollable virtual list                     |
| `useVirtualizationResizeObserver` | `hooks/useVirtualizationResizeObserver.hook.ts` | Preserves the ResizeObserver + RAF-based vertical virtualization experiment for side-by-side retesting        |

---

## Utility Functions

### `src/hooks/utils/`

| Function                          | Location                                              | Description                                                                |
| --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `findFirstVisibleIndex`           | `hooks/utils/findFirstVisibleIndex.util.ts`           | Binary search: first index where `starts[i] + widths[i] > viewStart`       |
| `findFirstOutOfViewIndex`         | `hooks/utils/findFirstOutOfViewIndex.util.ts`         | Binary search: first index where `starts[i] >= viewEnd`                    |
| `getVerticalVirtualizationWindow` | `hooks/utils/getVerticalVirtualizationWindow.util.ts` | Computes fixed-row virtualization window geometry shared by vertical hooks |

### `src/components/Table/TableBody/utils/`

| Function                       | Location                                                                | Description                                                           |
| ------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `buildTableBodyCellDescriptor` | `components/Table/TableBody/utils/buildTableBodyCellDescriptor.util.ts` | Derives render-ready body-cell descriptor data from column + row      |
| `createRenderTableBodyCell`    | `components/Table/TableBody/utils/createRenderTableBodyCell.util.ts`    | Creates bound row-cell renderer from sizing/pinning + descriptor util |
| `generatePlaceholderData`      | `components/Table/TableBody/utils/generatePlaceholderData.util.ts`      | Builds empty placeholder rows keyed by visible columns                |
| `getTotalVisibleColumnCount`   | `components/Table/TableBody/utils/getTotalVisibleColumnCount.util.ts`   | Counts pinned, center, and spacer cells for spacer-row `colSpan`      |
| `renderTableBodyColumnGroup`   | `components/Table/TableBody/utils/renderTableBodyColumnGroup.util.ts`   | Maps a column group through the shared body-cell renderer             |

### `src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/`

| Function                    | Location                                                                                            | Description                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `getInitialColumnsState`    | `components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/getInitialColumnsState.util.ts`    | Builds initial column drawer state shape                  |
| `getTableColumnDrawerState` | `components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/getTableColumnDrawerState.util.ts` | Maps a table columns snapshot to drawer state for one key |

### `src/utils/api/`

| Function        | Location                | Description                                                                      |
| --------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `getApiBaseUrl` | `utils/api/api.util.ts` | Resolves API base URL for SSR/client via request URL, env var, or hostname logic |

### `src/utils/comparison/`

| Function       | Location                                | Description                                                      |
| -------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `shallowEqual` | `utils/comparison/shallowEqual.util.ts` | `{ objA, objB }` → `boolean`; one-level key+value equality check |

### `src/utils/filters/`

| Function                      | Location                                            | Description                                                                                 |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `createDistinctFilterOptions` | `utils/filters/createDistinctFilterOptions.util.ts` | Adapts a distinct-values API to table async filter options (`skip/limit` to `offset/limit`) |
| `createStaticFilterOptions`   | `utils/filters/createStaticFilterOptions.util.ts`   | Wraps a `string[]` into a `FilterOptionsResponse`-compatible paginated object               |

### `src/utils/globalSettings/`

| Function                           | Location                                                        | Description                                                                            |
| ---------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `getGlobalSettingsFromCookie`      | `utils/globalSettings/getGlobalSettingsFromCookie.util.ts`      | Reads global settings (pinning + navigation preferences) from cookie string (SSR-safe) |
| `serializeGlobalSettingsForCookie` | `utils/globalSettings/serializeGlobalSettingsForCookie.util.ts` | Serialises `GlobalSettingsState` to versioned JSON payload for cookie write            |
| `GLOBAL_SETTINGS_COOKIE_KEY`       | `utils/globalSettings/globalSettings.constants.ts`              | Cookie key constant (`global-settings`)                                                |
| `GLOBAL_SETTINGS_COOKIE_VERSION`   | `utils/globalSettings/globalSettings.constants.ts`              | Current payload version; incremented on breaking schema changes                        |

### `src/utils/theme/`

| Function             | Location                                 | Description                                      |
| -------------------- | ---------------------------------------- | ------------------------------------------------ |
| `getThemeFromCookie` | `utils/theme/getThemeFromCookie.util.ts` | Read theme mode from a cookie header (SSR-safe)  |
| `setThemeCookie`     | `utils/theme/setThemeCookie.util.ts`     | Write theme mode to browser cookie (client-safe) |

### `src/utils/logger/`

| Function       | Location                      | Description                                                                            |
| -------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `logger`       | `utils/logger/logger.util.ts` | Default singleton logger reading `VITE_LOG_LEVEL` env var                              |
| `createLogger` | `utils/logger/logger.util.ts` | Factory: `createLogger({ level?, prefix? })` → level-filtered, tree-shakeable `Logger` |

### `src/utils/prefetch/`

| Function                  | Location                                         | Description                                                                   |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `resolveFromCacheOrFetch` | `utils/prefetch/resolveFromCacheOrFetch.util.ts` | Resolves from prefetch cache (hit/in-flight) or falls back to a fresh fetch   |
| `prefetchNextPage`        | `utils/prefetch/prefetchNextPage.util.ts`        | Creates a prefetch request returning initial cache state + resolution promise |
| `firePrefetch`            | `utils/prefetch/firePrefetch.util.ts`            | Fires prefetch and applies result to a ref with staleness check               |

### `src/utils/security/`

| Function             | Location                          | Description                                            |
| -------------------- | --------------------------------- | ------------------------------------------------------ |
| `getRequestCspNonce` | `utils/security/cspNonce.util.ts` | Reads standardized `x-csp-nonce` header from a request |

### `src/utils/formatters/`

| Function                   | Location                                            | Description                                                          |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `formatCurrency`           | `utils/formatters/formatCurrency.util.ts`           | Number → locale currency string via `Intl.NumberFormat`              |
| `formatDate`               | `utils/formatters/formatDate.util.ts`               | Date/string/timestamp → locale date string via `Intl.DateTimeFormat` |
| `formatNumber`             | `utils/formatters/formatNumber.util.ts`             | Number → locale number string with configurable decimal places       |
| `parseDate`                | `utils/formatters/parseDate.util.ts`                | Date object / ISO string / timestamp → `Date` instance               |
| `getDateTimeFormatOptions` | `utils/formatters/getDateTimeFormatOptions.util.ts` | `DateFormatPreset` → `Intl.DateTimeFormatOptions`                    |
| `getDefaultLocale`         | `utils/formatters/getDefaultLocale.util.ts`         | Returns `'en-US'` (consistent between server and client)             |

### `src/utils/storage/`

| Function              | Location                                    | Description                                                                        |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `buildCookieString`   | `utils/storage/buildCookieString.util.ts`   | Serialises key/value to a `Set-Cookie` string (1y expiry, `SameSite=Lax`)          |
| `parseCookies`        | `utils/storage/parseCookies.util.ts`        | Splits a raw `Cookie:` header string into a `Record<string, string>` key/value map |
| `readFromCookie`      | `utils/storage/readFromCookie.util.ts`      | Reads a named cookie value from `document.cookie` or a provided string (SSR-safe)  |
| `writeToCookie`       | `utils/storage/writeToCookie.util.ts`       | Writes a cookie via `document.cookie` or returns a `Set-Cookie` header (SSR-safe)  |
| `writeToLocalStorage` | `utils/storage/writeToLocalStorage.util.ts` | Writes to `localStorage` with error handling for quota/disabled scenarios          |

### `src/utils/urlState/`

| Function                    | Location                                           | Description                                                                           |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------- |
| `encodeStateToURL`          | `utils/urlState/encodeStateToURL.util.ts`          | Serialises a state object to a Base64 URL-safe string (converts `Set` → `Array`)      |
| `decodeStateFromURL`        | `utils/urlState/decodeStateFromURL.util.ts`        | Deserialises a Base64 URL-safe string back to a state object                          |
| `readStateFromURL`          | `utils/urlState/readStateFromURL.util.ts`          | Reads + decodes a single key from `URLSearchParams`                                   |
| `readTableStateFromURL`     | `utils/urlState/readTableStateFromURL.util.ts`     | Convenience wrapper: reads sorting, filters, and column-visibility state from the URL |
| `serializeFiltersToURL`     | `utils/urlState/serializeFiltersToURL.util.ts`     | `ColumnFiltersState` → compact JSON using operator short-codes                        |
| `deserializeFiltersFromURL` | `utils/urlState/deserializeFiltersFromURL.util.ts` | Compact URL param → full `ColumnFiltersState`                                         |
| `deserializeFilter`         | `utils/urlState/deserializeFilter.util.ts`         | Deserialises a single compact filter value with type inference                        |
| `serializeSortingToURL`     | `utils/urlState/serializeSortingToURL.util.ts`     | `SortingState[]` → compact `{ [key]: 'asc'                                            | 'desc' }` object |
| `deserializeSortingFromURL` | `utils/urlState/deserializeSortingFromURL.util.ts` | Compact sorting URL param → `SortingState[]`                                          |

### `src/routes/utils/`

| Function                          | Location                                               | Description                                                             |
| --------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `readTableLoaderStateFromRequest` | `routes/utils/readTableLoaderStateFromRequest.util.ts` | Shared loader bootstrap from URL + cookie state for table-backed routes |

---

## Constants

| Export(s)                                                                                                                                                            | Location                                    | Description                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `API_SERVER_PORT`, `CONFIG`                                                                                                                                          | `constants/api.constants.ts`                | API server port and host config per environment (dev / localhost / prod)          |
| `OPERATOR_TO_SHORT`, `SHORT_TO_OPERATOR`, `TEXT_OPERATORS`, `NUMBER_OPERATORS`, `DATE_OPERATORS`, …                                                                  | `constants/filterOperators.constants.ts`    | Bidirectional operator ↔ short-code maps and operator arrays per data type        |
| `DEFAULT_CONTAINER_HEIGHT`, `DEFAULT_CONTAINER_WIDTH`, `DEFAULT_ROW_OVERSCAN`, `DEFAULT_COLUMN_OVERSCAN`                                                             | `constants/virtualization.constants.ts`     | Default dimensions and overscan values for virtualization hooks                   |
| `DEFAULT_LOCALE`, `DEFAULT_CURRENCY`, `DEFAULT_DATE_PRESET`                                                                                                          | `utils/formatters/formatters.constants.ts`  | Formatting defaults (`en-US`, `USD`, `medium`)                                    |
| `INITIAL_PAGE_SIZE`, `LOAD_MORE_PAGE_SIZE`, `DEFAULT_FILTER_PAGE_SIZE`, `DEFAULT_ENABLE_PREFETCH`, …                                                                 | `components/Table/Table.constants.ts`       | Table pagination sizes, prefetch toggle, scroll threshold, column widths          |
| `NAVIGATION_SIZE_PREFERENCE_OPTIONS`                                                                                                                                 | `constants/globalSettings.constants.ts`     | Labelled option array for global navigation sizing (`compact/small/medium/large`) |
| `ORDER_CONFLICT_OPTIONS`, `ORDER_CONFLICT_PREFERENCE_OPTIONS`, `PIN_SIDE_PREFERENCE_OPTIONS`, `PIN_CONFLICT_PREFERENCE_OPTIONS`, `UNPIN_CONFLICT_PREFERENCE_OPTIONS` | `constants/pinningPreferences.constants.ts` | Labelled option arrays for pinning runtime modals and preference radio groups     |

---

## Types

| Key Exports                                                                                                                                                                                                                             | Location                            | Description                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `DesignSystemColor`, `DesignSystemSize`, `DesignSystemOrientation`, `DesignSystemStyle`, `DesignSystemWidth`                                                                                                                            | `types/design-system.types.ts`      | Union types for all design-system prop values                                                 |
| `BooleanFilter`, `DateFilter`, `NumberFilter`, `SelectFilter`, `TextFilter`, `ColumnFilter`                                                                                                                                             | `types/filterOperators.types.ts`    | Discriminated union for all column filter states                                              |
| `DateFormatPreset`, `DateFormatOptions`, `CurrencyFormatOptions`, `NumberFormatOptions`                                                                                                                                                 | `types/format.types.ts`             | Options for the formatter utilities                                                           |
| `ThemeMode`, `ThemeContextValue`                                                                                                                                                                                                        | `types/theme.types.ts`              | Light/dark mode enum and context shape                                                        |
| `InfiniteScroll`, `Pagination`, `PinSide`, `SortDirection`, `Sorting`, `PinConflictState`, `PrefetchCache`                                                                                                                              | `types/ui.types.ts`                 | Shared UI primitive types                                                                     |
| `ApiConfig`                                                                                                                                                                                                                             | `types/api.types.ts`                | API config shape keyed by environment                                                         |
| `DbSanityPayload`                                                                                                                                                                                                                       | `root/Root.types.ts`                | Dev preflight response shape for `/api/db-sanity`                                             |
| `OrderConflictResolution`, `OrderConflictResolutionPreferenceOption`, `PinConflictResolution`, `PinSidePreferenceOption`, `PinConflictResolutionPreferenceOption`, `UnpinConflictResolution`, `UnpinConflictResolutionPreferenceOption` | `types/pinningPreferences.types.ts` | Pinning prompt resolution unions and preference option unions including `always-ask` sentinel |
| `GlobalNavigationPreferences`, `GlobalNavigationSizePreference`, `GlobalPinningPreferences`, `GlobalSettingsState`                                                                                                                      | `types/globalSettings.types.ts`     | Global settings state shape (navigation + pinning) persisted in `global-settings` cookie      |

## Routes

| Route                         | Location                             | Description                                                                                        |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `/wide-alltypes-150`          | `routes/wide-alltypes-150/`          | Stress-test page for the `wide_alltypes_150` dataset using the shared `TableLayout` implementation |
| `/wide-alltypes-150-tanstack` | `routes/wide-alltypes-150-tanstack/` | Sibling experiment for the same dataset using TanStack Table, TanStack Query, and TanStack Virtual |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
