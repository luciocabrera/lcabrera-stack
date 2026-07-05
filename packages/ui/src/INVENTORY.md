# Artifact Inventory (`@repo/ui`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

**Visibility.** Every artifact is either **Public** or a **Private delegate**, and its location tells you which:

- **Public** — exported from a barrel `index.ts` and imported across modules via `@repo/ui/...`. Every top-level `components/<Name>/` entry is Public.
- **Private delegate** — nested _inside_ another component/module and imported only within that parent (everything under `components/Form/…`, `components/Table/…`, and every `*/utils/` or `hooks/utils/` helper).

Private delegates are catalogued here on purpose — reuse or lift one before writing a duplicate — but treat them as internal: prefer enhancing or relocating over importing them across unrelated modules.

Covers `packages/ui` only. API-layer utilities (`api.util.ts`, `buildPaginatedQueryParams`, `fetchAndValidate`, `api.constants.ts`, `api.types.ts`) and Postgres-access utilities (`db/env.schema.ts`, `db/getPool.util.ts`) live in `@repo/data-access` (`packages/data-access/src/`) — small enough it doesn't need its own inventory yet. App-local artifacts (routes, route-specific services) are tracked in each app's own `src/INVENTORY.md`.

---

## Components

| Component                            | Location                                               | Description                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppNavigation`                      | `components/AppNavigation/`                            | App-agnostic left sidebar navigation using `SidePanel`, `Toolbar`, compact/full modes, and pin/unpin controls — route items are supplied by each consuming app via `getNavigationItems`                                                                                                                                                                                                             |
| `Button`                             | `components/Button/`                                   | Interactive button — 8 color variants, 5 sizes, icon, loading, tooltip                                                                                                                                                                                                                                                                                                                              |
| `Card`                               | `components/Card/`                                     | Container with elevation, color, padding, optional interactivity, and a `customStylex` override (e.g. for width/height)                                                                                                                                                                                                                                                                             |
| `Checkbox`                           | `components/Checkbox/`                                 | Reusable controlled checkbox with shared custom icon overlay used by table and VirtualList                                                                                                                                                                                                                                                                                                          |
| `ConfirmDialog`                      | `components/ConfirmDialog/`                            | Generic yes/no confirmation prompt built on `Modal` — first used by `Form`'s discard-unsaved-changes-on-cancel flow                                                                                                                                                                                                                                                                                 |
| `CopyButton`                         | `components/CopyButton/`                               | Icon-only button that copies a string to the clipboard, with a brief checkmark/"Copied!" confirmation                                                                                                                                                                                                                                                                                               |
| `DevStyleXInject`                    | `components/DevStyleXInject/`                          | Dev-only StyleX CSS injector for HMR; must be at app root                                                                                                                                                                                                                                                                                                                                           |
| `DraggableList`                      | `components/DraggableList/`                            | Drag-and-drop reorderable list using native drag events                                                                                                                                                                                                                                                                                                                                             |
| `Form`                               | `components/Form/`                                     | Declarative `fields`-driven form (ADR-005) — `group`/`row`/`tab` recursion, registry-dispatched leaf types (incl. `path`, a browsable filesystem-path picker), RR7 native `<Form>`/`useNavigation` by default, `create`/`edit`/`view` modes with dirty-check-gated edit submission, built-in Accept/Cancel footer (`cancelTo` + unsaved-changes confirmation via `useBackNavigate`/`ConfirmDialog`) |
| `Icons`                              | `components/Icons/`                                    | SVG icon components (see `Icons/index.ts` for the full, current list); 24×24 stroke icons share the internal `IconBase` svg wrapper                                                                                                                                                                                                                                                                 |
| `InfoBox`                            | `components/InfoBox/`                                  | Styled container for informational messages and empty states                                                                                                                                                                                                                                                                                                                                        |
| `JsonExplorer`                       | `components/JsonExplorer/`                             | Tabs + per-section `StaticTable` viewer for pre-shaped raw-JSON sections (columns inferred server-side via `inferTableColumnsFromJson`), with a per-section copy-raw-JSON button                                                                                                                                                                                                                    |
| `MarkdownRenderer`                   | `components/MarkdownRenderer/`                         | Renders Markdown as styled HTML via `react-markdown`, per-element `components` overrides (StyleX has no descendant selectors); raw HTML in source is inert by default                                                                                                                                                                                                                               |
| `Modal`                              | `components/Modal/`                                    | Native `<dialog>` modal with title, footer, Esc-to-close                                                                                                                                                                                                                                                                                                                                            |
| `NavLink`                            | `components/NavLink/`                                  | Router-aware navigation link with color, size, icon, orientation                                                                                                                                                                                                                                                                                                                                    |
| `NotificationCenter`                 | `components/NotificationCenter/`                       | Global corner-based notification viewport with dismiss + auto-hide using NotificationContext, local constants, and view utilities                                                                                                                                                                                                                                                                   |
| `NotificationItem`                   | `components/NotificationCenter/NotificationItem/`      | Private delegate — single notification row renderer used by `NotificationCenter`; composes Card surface, accent rail, and dismiss action                                                                                                                                                                                                                                                            |
| `PinSideModal`                       | `components/PinSideModal/`                             | Modal for choosing column pin side (left / right / closest-edge)                                                                                                                                                                                                                                                                                                                                    |
| `RadioOptionGroup`                   | `components/RadioOptionGroup/`                         | Generic `<TValue extends string>` radio button group                                                                                                                                                                                                                                                                                                                                                |
| `RouteErrorBoundary`                 | `components/RouteErrorBoundary/`                       | Shared route error boundary display with retry button; accepts `defaultMessage` and `error` props                                                                                                                                                                                                                                                                                                   |
| `SectionCard`                        | `components/SectionCard/`                              | Generic bordered "section box" — title, optional description, arbitrary children, `customStylex` override; extracted from `Settings/SettingsOptionSection`                                                                                                                                                                                                                                          |
| `SidePanel`                          | `components/SidePanel/`                                | Off-canvas panel with 10 sub-components, pinning, portal support                                                                                                                                                                                                                                                                                                                                    |
| `StaticTable`                        | `components/StaticTable/`                              | Wires an already-resolved, non-paginated row array into real `Table` sort/filter/pin machinery — use instead of `TableLayout` when a loader already has the full row set (no separate paginated API to call)                                                                                                                                                                                        |
| `StatusBadge`                        | `components/StatusBadge/`                              | Generic label + semantic tone pill (`error`\|`info`\|`neutral`\|`success`\|`warning`); domain status→tone mapping stays in the consuming app                                                                                                                                                                                                                                                        |
| `Table`                              | `components/Table/`                                    | Full-featured data table — sort, filter, pin, resize, virtualise, persist, opt-in prefetch (ADR-006)                                                                                                                                                                                                                                                                                                |
| `TableCreateLink`                    | `components/Table/TableCreateLink/`                    | Icon-only "+" `NavLink` for a `Table`'s `actions` slot, sized to match the built-in settings-gear button; tooltip/aria-label read "Create {title}"                                                                                                                                                                                                                                                  |
| `TableSettingsDrawerSkeleton`        | `components/Table/TableSettingsDrawerSkeleton/`        | Legacy pinned loading shell kept as a fallback artifact; active drawer loading now uses busy overlays on real settings controls                                                                                                                                                                                                                                                                     |
| `TableSettingsDrawer/DetailsSection` | `components/Table/TableSettingsDrawer/DetailsSection/` | Read-only details panel inside table settings showing required counts plus optional metadata                                                                                                                                                                                                                                                                                                        |
| `TableBodyRows`                      | `components/Table/TableBodyRows/`                      | Row-rendering delegate for TableBody — owns the visible-row loop and cell creation via utility reuse                                                                                                                                                                                                                                                                                                |
| `TableEmptyState`                    | `components/Table/TableEmptyState/`                    | No-data row for TableBody — theme-adaptive `NoDataDescriptive` illustration + title/message + Retry (RR7 `useRevalidator`), sticky-centered to the scroll viewport via `useElementSize` regardless of body overflow                                                                                                                                                                                 |
| `Tabs`                               | `components/Tabs/`                                     | Keyboard-navigable tab bar using React 19 `<Activity>`                                                                                                                                                                                                                                                                                                                                              |
| `Tag`                                | `components/Tag/`                                      | Label chip with optional remove button                                                                                                                                                                                                                                                                                                                                                              |
| `ToggleSwitch`                       | `components/ToggleSwitch/`                             | Accessible boolean toggle (controlled, `role="switch"`)                                                                                                                                                                                                                                                                                                                                             |
| `Toolbar`                            | `components/Toolbar/`                                  | Horizontal/vertical toolbar of Button/NavLink items                                                                                                                                                                                                                                                                                                                                                 |
| `TrendSparkline`                     | `components/TrendSparkline/`                           | Hand-rolled SVG sparkline from a chronological number array; caller supplies the tone (no domain opinion on up/down meaning)                                                                                                                                                                                                                                                                        |
| `SectionToolbar`                     | `components/Table/TableSettingsDrawer/SectionToolbar/` | Shared drawer-section toolbar: renders action buttons from descriptors + owns footer/toolbar variant presentation                                                                                                                                                                                                                                                                                   |
| `ColumnWidthPresetButtons`           | `components/Table/shared/ColumnWidthPresetButtons/`    | Shared 3-button column-width preset group (min/max/default); used by `GeneralSection` and `GeneralSettingsSection` in both drawers                                                                                                                                                                                                                                                                  |
| `Tooltip`                            | `components/Tooltip/`                                  | CSS Anchor + Popover API tooltip, 4 placements, animated                                                                                                                                                                                                                                                                                                                                            |
| `VirtualList`                        | `components/VirtualList/`                              | Virtualized list with extracted Header/Body subcomponents, search, select-all, checkboxes, lazy load, parent-contained sizing                                                                                                                                                                                                                                                                       |
| `VirtualSelect`                      | `components/VirtualSelect/`                            | Parent-contained dropdown select backed by `VirtualList`; `string[]` or `{ label, value }[]` options                                                                                                                                                                                                                                                                                                |
| `FormBody`                           | `components/Form/FormBody/`                            | Private delegate — the Form view: RR7 native `<Form>`/`fetcher.Form`, footer, and dirty-check-gated submit                                                                                                                                                                                                                                                                                          |
| `FormFields`                         | `components/Form/FormFields/`                          | Private delegate — recursive walker; computes a stable key and dispatches each node type to its subcomponent                                                                                                                                                                                                                                                                                        |
| `FormFieldGroup`                     | `components/Form/FormFields/FormFieldGroup/`           | Private delegate — renders a `group` node: optional label + nested `FormFields`                                                                                                                                                                                                                                                                                                                     |
| `FormFieldRow`                       | `components/Form/FormFields/FormFieldRow/`             | Private delegate — renders a `row` node: horizontal equal-flex cells of nested `FormFields`                                                                                                                                                                                                                                                                                                         |
| `FormFieldTabs`                      | `components/Form/FormFields/FormFieldTabs/`            | Private delegate — renders a `tab` node: one `Tabs` panel per tab                                                                                                                                                                                                                                                                                                                                   |
| `FormField`                          | `components/Form/FormField/`                           | Private delegate — registry dispatch by `field.type` to the matching leaf field component                                                                                                                                                                                                                                                                                                           |
| `FormFieldChrome`                    | `components/Form/FormFieldChrome/`                     | Private delegate — shared label/description/error wrapper for leaf fields                                                                                                                                                                                                                                                                                                                           |
| `TextField`                          | `components/Form/fields/TextField/`                    | Private delegate — leaf input for `text`/`email`/`password`/`textarea`                                                                                                                                                                                                                                                                                                                              |
| `NumberField`                        | `components/Form/fields/NumberField/`                  | Private delegate — leaf input for `number`                                                                                                                                                                                                                                                                                                                                                          |
| `DateField`                          | `components/Form/fields/DateField/`                    | Private delegate — leaf input for `date`/`datetime`                                                                                                                                                                                                                                                                                                                                                 |
| `BooleanField`                       | `components/Form/fields/BooleanField/`                 | Private delegate — wraps `Checkbox` or `ToggleSwitch` for `boolean`                                                                                                                                                                                                                                                                                                                                 |
| `SelectField`                        | `components/Form/fields/SelectField/`                  | Private delegate — wraps `VirtualSelect` + hidden inputs for FormData                                                                                                                                                                                                                                                                                                                               |
| `RadioField`                         | `components/Form/fields/RadioField/`                   | Private delegate — wraps `RadioOptionGroup` for `radio`                                                                                                                                                                                                                                                                                                                                             |
| `PathField`                          | `components/Form/fields/PathField/`                    | Private delegate — text input + Browse… button for `path`; opens `PathBrowserModal`                                                                                                                                                                                                                                                                                                                 |
| `PathBrowserModal`                   | `components/Form/fields/PathField/PathBrowserModal/`   | Private delegate — directory drill-down UI over `@repo/ui/routing/browseDirectory.loader` via `useFetcher().load`                                                                                                                                                                                                                                                                                   |
| `CustomField`                        | `components/Form/fields/CustomField/`                  | Private delegate — escape hatch rendering `field.renderField(...)`                                                                                                                                                                                                                                                                                                                                  |

---

## Features

| Feature    | Location             | Description                                                                                                                  |
| ---------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `showcase` | `features/showcase/` | Home-route isolated design-system showcase composed from reusable components; keeps demo logic outside shared domain modules |

---

## Hooks

| Hook                        | Location                                  | Description                                                                                                                                            |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useBackNavigate`           | `hooks/useBackNavigate.hook.ts`           | Returns a `goBack(fallbackTo)` function: navigates to the previous in-app history entry if one exists (`history.state.idx`), otherwise to `fallbackTo` |
| `useClickOutside`           | `hooks/useClickOutside.hook.ts`           | Fires callback when a `mousedown` occurs outside a given ref                                                                                           |
| `useElementSize`            | `hooks/useElementSize.hook.ts`            | Tracks a referenced element's client (scrollbar-excluded) `{ height, width }` via ResizeObserver; SSR-safe (`0/0` until measured)                      |
| `useInfiniteScrollObserver` | `hooks/useInfiniteScrollObserver.hook.ts` | Fires `onReachEnd` when a sentinel element nears the bottom of a scroll container via IntersectionObserver                                             |
| `useStore`                  | `hooks/useStore.hook.ts`                  | Ref-based external store with shallow-equality guard, subscribe, reset, SSR snapshot                                                                   |
| `useTheme`                  | `hooks/useTheme.hook.ts`                  | Returns `{ theme, setTheme }` from `ThemeContext` via React 19 `use()`                                                                                 |
| `useVirtualization`         | `hooks/useVirtualization.hook.ts`         | Computes `startIndex`, `endIndex`, `totalHeight`, `offsetY` for a scrollable virtual list (ResizeObserver + RAF-batched scroll)                        |

---

## Utility Functions

### `src/hooks/utils/`

| Function                          | Location                                              | Description                                                                                             |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `getVerticalVirtualizationWindow` | `hooks/utils/getVerticalVirtualizationWindow.util.ts` | Computes fixed-row virtualization window geometry shared by vertical hooks                              |
| `setupObservedContainer`          | `hooks/utils/setupObservedContainer.util.ts`          | Attaches a ResizeObserver + scroll listener to a container element; preserves scroll position on resize |

### `src/components/Form/utils/` _(private delegates)_

| Function              | Location                                            | Description                                                                                 |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `flattenFields`       | `components/Form/utils/flattenFields.util.ts`       | Recursive walker → `readonly LeafFieldDef[]` (render/validation source of truth)            |
| `getInitialValues`    | `components/Form/utils/getInitialValues.util.ts`    | Merges `leafFields` defaults with `initialValues` → full `TValues`                          |
| `validateFields`      | `components/Form/utils/validateFields.util.ts`      | Orchestrates client validation over leaf fields → `FieldErrors` (non-Zod, instant feedback) |
| `validateField`       | `components/Form/utils/validateField.util.ts`       | Validates one leaf field's value; delegates to the string/number helpers                    |
| `validateStringValue` | `components/Form/utils/validateStringValue.util.ts` | `minLength`/`maxLength`/`pattern` check for string values                                   |
| `validateNumberValue` | `components/Form/utils/validateNumberValue.util.ts` | `min`/`max` check for number values                                                         |
| `isFormDirty`         | `components/Form/utils/isFormDirty.util.ts`         | Array-aware subset compare of values vs the initial snapshot for edit-mode gating           |

### `src/components/Form/FormFields/utils/` _(private delegates)_

| Function           | Location                                                    | Description                                                           |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `collectAccessors` | `components/Form/FormFields/utils/collectAccessors.util.ts` | Node → flattened list of descendant leaf accessors (recursive)        |
| `getFieldKey`      | `components/Form/FormFields/utils/getFieldKey.util.ts`      | Node → stable React key derived from node type + descendant accessors |

### `src/components/Table/TableBody/utils/`

| Function                       | Location                                                                | Description                                                           |
| ------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `buildTableBodyCellDescriptor` | `components/Table/TableBody/utils/buildTableBodyCellDescriptor.util.ts` | Derives render-ready body-cell descriptor data from column + row      |
| `createRenderTableBodyCell`    | `components/Table/TableBody/utils/createRenderTableBodyCell.util.ts`    | Creates bound row-cell renderer from sizing/pinning + descriptor util |
| `generatePlaceholderData`      | `components/Table/TableBody/utils/generatePlaceholderData.util.ts`      | Builds empty placeholder rows keyed by visible columns                |
| `getTotalVisibleColumnCount`   | `components/Table/TableBody/utils/getTotalVisibleColumnCount.util.ts`   | Counts pinned, center, and spacer cells for spacer-row `colSpan`      |
| `renderTableBodyColumnGroup`   | `components/Table/TableBody/utils/renderTableBodyColumnGroup.util.ts`   | Maps a column group through the shared body-cell renderer             |

### `src/components/Table/utils/`

| Function                                   | Location                                                                  | Description                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `deriveColumnViewState`                    | `components/Table/utils/deriveColumnViewState.util.ts`                    | Composes normalized columns with effective columns, grouped pinning state, and pinned offsets             |
| `getColumnPinSide`                         | `components/Table/utils/getColumnPinSide.util.ts`                         | Returns `'left'`, `'right'`, or `undefined` for a column key given current pinning state                  |
| `getEffectiveColumns`                      | `components/Table/utils/getEffectiveColumns.util.ts`                      | Returns visible columns in display order applying visibility, order, and pinning                          |
| `getNewColumnFiltersBasedOnColumnKey`      | `components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util.ts`      | Builds next `ColumnFiltersState` by replacing/removing the entry for one column key                       |
| `getNewColumnSizingBasedOnColumnKey`       | `components/Table/utils/getNewColumnSizingBasedOnColumnKey.util.ts`       | Builds next `ColumnSizingState` by replacing/removing the width entry for one column key                  |
| `getNewPinningBasedOnColumnKey`            | `components/Table/utils/getNewPinningBasedOnColumnKey.util.ts`            | Builds next `ColumnPinningState` by pinning or unpinning one column, honoring static key constraints      |
| `getNewSortingBasedOnColumnKey`            | `components/Table/utils/getNewSortingBasedOnColumnKey.util.ts`            | Builds next `SortingState` by adding, updating (in-place), or removing the sort entry for one column key  |
| `getNormalizedColumns`                     | `components/Table/utils/getNormalizedColumns.util.ts`                     | Enriches columns with sort direction and sort index metadata                                              |
| `getPinnedColumnOffsets`                   | `components/Table/utils/getPinnedColumnOffsets.util.ts`                   | Computes sticky `left`/`right` pixel offsets and pin-boundary markers for pinned columns                  |
| `getPinnedDerivedColumnsState`             | `components/Table/utils/getPinnedDerivedColumnsState.util.ts`             | Computes effective columns, pin-based groups, and pinned offsets together in one call                     |
| `getPersistedUiState`                      | `components/Table/utils/getPersistedUiState.util.ts`                      | Extracts the persisted drawer/tab/filter UI subset from full table meta state                             |
| `persistTableMetaUiState`                  | `components/Table/utils/persistTableMetaUiState.util.ts`                  | Persists tab-scoped table meta UI slices directly from mutation actions                                   |
| `getStaticColumnKeys`                      | `components/Table/utils/getStaticColumnKeys.util.ts`                      | Returns a `Set` of keys for columns marked as non-reorderable                                             |
| `getStorageKey`                            | `components/Table/utils/getStorageKey.util.ts`                            | Builds a namespaced `persistenceKey:slice` storage key                                                    |
| `insertAfterLeftPinned`                    | `components/Table/utils/insertAfterLeftPinned.util.ts`                    | Inserts a column immediately after the remaining left-pinned group in an order array                      |
| `insertBeforeRightPinned`                  | `components/Table/utils/insertBeforeRightPinned.util.ts`                  | Inserts a column immediately before the remaining right-pinned group in an order array                    |
| `resolveUnpinnedOrder`                     | `components/Table/utils/resolveUnpinnedOrder.util.ts`                     | Resolves unpin placement based on previous pin side and current pinning groups                            |
| `readPersistedDataStateFromSessionStorage` | `components/Table/utils/readPersistedDataStateFromSessionStorage.util.ts` | Reads tab-scoped persisted table rows for stale refresh rendering                                         |
| `readPersistedStateFromCookie`             | `components/Table/utils/readPersistedStateFromCookie.util.ts`             | Parses table persisted state from cookies; SSR-safe                                                       |
| `readPersistedStateFromSessionStorage`     | `components/Table/utils/readPersistedStateFromSessionStorage.util.ts`     | Reads tab-scoped persisted column state slices from sessionStorage                                        |
| `collectPersistedStateSlices`              | `components/Table/utils/collectPersistedStateSlices.util.ts`              | Shared slice collector for the cookie/sessionStorage readers (version check + `columnVisibility` Set)     |
| `readPersistedUiStateFromSessionStorage`   | `components/Table/utils/readPersistedUiStateFromSessionStorage.util.ts`   | Reads tab-scoped persisted table UI slices (drawers/tab/expanded filters)                                 |
| `resolveFetchMoreState`                    | `components/Table/utils/resolveFetchMoreState.util.ts`                    | Shared helper that merges paginated rows/options and recomputes `hasMore`, `totalLoadedRows`, `totalRows` |
| `serializeStateSlice`                      | `components/Table/utils/serializeStateSlice.util.ts`                      | Converts a state slice to a `{ key, value }` payload for cookie/localStorage write                        |
| `splitColumnsByPinning`                    | `components/Table/utils/splitColumnsByPinning.util.ts`                    | Splits effective columns into left, center, and right pin groups                                          |
| `syncColumnOrderWithPinning`               | `components/Table/utils/syncColumnOrderWithPinning.util.ts`               | Reorders column order array to keep pinned columns grouped; tolerates missing current order               |
| `writePersistedDataStateToSessionStorage`  | `components/Table/utils/writePersistedDataStateToSessionStorage.util.ts`  | Writes tab-scoped persisted table rows for refresh reuse                                                  |
| `writePersistedUiStateToSessionStorage`    | `components/Table/utils/writePersistedUiStateToSessionStorage.util.ts`    | Writes tab-scoped persisted table UI slices                                                               |
| `writeStateSlice`                          | `components/Table/utils/writeStateSlice.util.ts`                          | Writes a serialized state slice to cookie or localStorage                                                 |

### `src/components/Table/contexts/TableConfig/columns/actions/`

| Artifact                           | Location                                                                                               | Description                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `buildPersistencePayload`          | `components/Table/contexts/TableConfig/columns/actions/buildPersistencePayload.util.ts`                | Builds the persistence entry array shared by batch column and batch table settings actions                         |
| `commitPinningAndOrderUpdate`      | `components/Table/contexts/TableConfig/columns/actions/commitPinningAndOrderUpdate.util.ts`            | Commits pinning/order persistence and applies synced derived slices to store                                       |
| `resolveBatchColumnSettingsUpdate` | `components/Table/contexts/TableConfig/columns/actions/utils/resolveBatchColumnSettingsUpdate.util.ts` | Resolves a per-column batch settings change into next filters, sorting, sizing, pinning, order, and derived slices |
| `resolveBatchTableSettingsUpdate`  | `components/Table/contexts/TableConfig/columns/actions/utils/resolveBatchTableSettingsUpdate.util.ts`  | Resolves a table-wide settings change into next filters, sorting, sizing, visibility, and derived slices           |
| `useAcceptHeaderPinConflict`       | `components/Table/contexts/TableConfig/columns/actions/useAcceptHeaderPinConflict.hook.ts`             | Resolves a pin conflict triggered from a column header interaction                                                 |
| `useAcceptHeaderPinSide`           | `components/Table/contexts/TableConfig/columns/actions/useAcceptHeaderPinSide.hook.ts`                 | Accepts a pin-side selection from a header, resolving conflict state via `PinConflictState`                        |
| `useBatchSetColumnSettings`        | `components/Table/contexts/TableConfig/columns/actions/useBatchSetColumnSettings.hook.ts`              | Orchestrates all per-column setting changes (sort/filter/size/pin/order) and persists in one action                |
| `useBatchSetTableSettings`         | `components/Table/contexts/TableConfig/columns/actions/useBatchSetTableSettings.hook.ts`               | Batch-applies full table settings (filters, sorting, sizing, visibility, order) in one action                      |
| `useSetColumnFilter`               | `components/Table/contexts/TableConfig/columns/actions/useSetColumnFilter.hook.ts`                     | Sets or removes a filter for one column; updates URL and resets pagination                                         |
| `useSetColumnPinning`              | `components/Table/contexts/TableConfig/columns/actions/useSetColumnPinning.hook.ts`                    | Pins or unpins one column, reconciling derived column order and offsets                                            |
| `useSetColumnSizing`               | `components/Table/contexts/TableConfig/columns/actions/useSetColumnSizing.hook.ts`                     | Sets the pixel width for one column and recomputes pinned offsets                                                  |
| `useSetColumnSorting`              | `components/Table/contexts/TableConfig/columns/actions/useSetColumnSorting.hook.ts`                    | Sets the sort direction for one column; updates URL and resets pagination                                          |
| `useSyncColumnsSizing`             | `components/Table/contexts/TableConfig/columns/actions/useSyncColumnsSizing.hook.ts`                   | Persists current column sizing state from store to cookie/localStorage                                             |

### `src/components/Table/contexts/TableConfig/meta/actions/`

| Artifact                             | Location                                                                                        | Description                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `useSetTableDrawersOpenState`        | `components/Table/contexts/TableConfig/meta/actions/useSetTableDrawersOpenState.hook.ts`        | Atomically sets table and column drawer open flags in one store update |
| `useSetTableSettingsExpandedFilters` | `components/Table/contexts/TableConfig/meta/actions/useSetTableSettingsExpandedFilters.hook.ts` | Persists expanded filter keys for table-settings drawer                |
| `useSetTableSettingsSelectedTab`     | `components/Table/contexts/TableConfig/meta/actions/useSetTableSettingsSelectedTab.hook.ts`     | Persists selected table-settings tab key in meta state                 |

### `src/components/Table/contexts/FiltersData/filters/actions/`

| Artifact                    | Location                                                                                  | Description                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `useFetchFilterData`        | `components/Table/contexts/FiltersData/filters/actions/useFetchFilterData.hook.ts`        | Orchestrates filter-option fetching by composing the initial and paginated actions for one column         |
| `useFetchInitialFilterData` | `components/Table/contexts/FiltersData/filters/actions/useFetchInitialFilterData.hook.ts` | Fetches the first page of filter options, updates totals, and optionally triggers prefetch                |
| `useFetchMoreFilterData`    | `components/Table/contexts/FiltersData/filters/actions/useFetchMoreFilterData.hook.ts`    | Loads and appends subsequent pages of filter options using cache-or-fetch and optional post-load prefetch |

### `src/components/Table/TableSettingsDrawer/TableDrawerContext/actions/`

| Artifact                         | Location                                                                                                 | Description                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `buildBatchTableSettingsUpdate`  | `components/Table/TableSettingsDrawer/TableDrawerContext/actions/buildBatchTableSettingsUpdate.util.ts`  | Normalizes a table-drawer snapshot into the full payload expected by `useBatchSetTableSettings`                      |
| `useBatchSetTableDrawerSettings` | `components/Table/TableSettingsDrawer/TableDrawerContext/actions/useBatchSetTableDrawerSettings.hook.ts` | Reads drawer-local table state and commits it through the table-level batch action                                   |
| `getDefaultColumnPinning`        | `components/Table/TableSettingsDrawer/TableDrawerContext/actions/getDefaultColumnPinning.util.ts`        | Returns table's current column pinning or the empty-side default; shared by clear-all and clear-column-order actions |

### `src/components/test-utils/`

| Function                              | Location                                                            | Description                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `createMockStore`                     | `components/test-utils/createMockStore.util.ts`                     | Generic external-store-like test scaffold (`get`, `set`, `reset`, `subscribe`, SSR snapshot) |
| `createPaginatedFetchActionMocks`     | `components/test-utils/createPaginatedFetchActionMocks.util.ts`     | Shared harness for paginated Table fetch-hook tests with stores + prefetch mocks             |
| `createTableConfigColumnsActionMocks` | `components/test-utils/createTableConfigColumnsActionMocks.util.ts` | Shared TableConfig columns-action test scaffold with mocked stores + persistence wiring      |
| `mockDialogElement`                   | `components/test-utils/mockDialogElement.util.ts`                   | Mocks HTMLDialogElement prototype behavior with restore handles for test teardown            |

### `src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/`

| Function                    | Location                                                                                            | Description                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `getInitialColumnsState`    | `components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/getInitialColumnsState.util.ts`    | Builds initial column drawer state shape                  |
| `getTableColumnDrawerState` | `components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/getTableColumnDrawerState.util.ts` | Maps a table columns snapshot to drawer state for one key |

### `src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/actions/`

| Artifact                          | Location                                                                                                    | Description                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `useBatchSetColumnDrawerSettings` | `components/Table/ColumnSettingsDrawer/ColumnDrawerContext/actions/useBatchSetColumnDrawerSettings.hook.ts` | Reads drawer-local column state and commits it through the table-level batch action |

### `src/components/Table/TableSettingsDrawer/ColumnOrderSection/utils/`

| Function | Location | Description |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- || `derivePinSideResolutionState` | `components/Table/TableSettingsDrawer/ColumnOrderSection/utils/derivePinSideResolutionState.util.ts` | Resolves pin-side choice (left/right/closest-edge) to next state or conflict flag, shared by drawer and header flows || `resolvePinConflictState` | `components/Table/TableSettingsDrawer/ColumnOrderSection/utils/resolvePinConflictState.util.ts` | Resolves pin-conflict resolution (`move-column`, `pin-all-between`, `pin-only`) into next `columnOrder` + `columnPinning` |
| `resolveToggleColumnPinIntent` | `components/Table/TableSettingsDrawer/ColumnOrderSection/utils/resolveToggleColumnPinIntent.util.ts` | Resolves toggle pin/unpin intent into direct updates or modal/auto-accept decisions |
| `restoreStaticPinnedColumns` | `components/Table/TableSettingsDrawer/ColumnOrderSection/utils/restoreStaticPinnedColumns.util.ts` | Restores static-column pin membership to default left/right pin groups after conflict resolution |

### `src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/`

| Function                            | Location                                                                                                                                    | Description                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `resolveOrderConflictUpdate`        | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveOrderConflictUpdate.util.ts`        | Decides whether a reordered column layout can be applied directly or must open/auto-accept the order-conflict flow                   |
| `applyToggleColumnPinResolution`    | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/applyToggleColumnPinResolution.util.ts`    | Applies resolved toggle-pin outcomes by dispatching pinning updates, modal state updates, and auto-accept actions                    |
| `resolveToggleColumnPinUpdate`      | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveToggleColumnPinUpdate.util.ts`      | Resolves static short-circuit plus pin-toggle intent into direct update or modal/auto-accept outcomes                                |
| `resolveAcceptedOrderConflictState` | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedOrderConflictState.util.ts` | Resolves accepted order-conflict state into final order/pinning with static restoration                                              |
| `resolveAcceptedPinSideUpdate`      | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedPinSideUpdate.util.ts`      | Resolves accepted pin-side actions into direct updates or conflict-modal/auto-accept outcomes                                        |
| `resolveAcceptedUnpinConflictState` | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedUnpinConflictState.util.ts` | Resolves unpin-conflict choices into pinning-only updates or reorder+pinning updates                                                 |
| `readPinActionState`                | `components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/readPinActionState.util.ts`                | Reads columns, order, pinning, and static keys from table + drawer store snapshots; shared by pin-conflict and pin-side action hooks |

### `src/components/Table/contexts/TableData/utils/`

| Function                          | Location                                                                            | Description                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `getInitialDataState`             | `components/Table/contexts/TableData/utils/getInitialDataState.util.ts`             | Builds initial table data state with derived `hasMore` and `totalLoadedRows`                    |
| `shouldHydratePersistedDataState` | `components/Table/contexts/TableData/utils/shouldHydratePersistedDataState.util.ts` | Allows persisted data hydration only when totals and initial-page prefix match current snapshot |

### `src/utils/api/`

| Function                    | Location                                      | Description                                                                       |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `getApiBaseUrl`             | `utils/api/api.util.ts`                       | Resolves API base URL for SSR/client via request URL, env var, or hostname logic  |
| `buildPaginatedQueryParams` | `utils/api/buildPaginatedQueryParams.util.ts` | Builds `limit`/`skip`/`sort`/`filter` query params for paginated service fetchers |
| `fetchAndValidate`          | `utils/api/fetchAndValidate.util.ts`          | Fetch + OK-assert + JSON parse + type-guard validation, returning the typed body  |

### `src/utils/typeGuards/`

| Function   | Location                            | Description                                                                                       |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `isObject` | `utils/typeGuards/isObject.util.ts` | `unknown` → `value is Record<string, unknown>`; shared non-null object guard — never redeclare it |

### `src/utils/comparison/`

| Function         | Location                                  | Description                                                                |
| ---------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `areArraysEqual` | `utils/comparison/areArraysEqual.util.ts` | `{ left, right }` → `boolean`; ordered strict equality for array values    |
| `areEqualByJson` | `utils/comparison/areEqualByJson.util.ts` | `{ left, right }` → `boolean`; deep structural equality via JSON.stringify |
| `shallowEqual`   | `utils/comparison/shallowEqual.util.ts`   | `{ objA, objB }` → `boolean`; one-level key+value equality check           |

### `src/utils/filters/`

| Function                      | Location                                            | Description                                                                                 |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `createDistinctFilterOptions` | `utils/filters/createDistinctFilterOptions.util.ts` | Adapts a distinct-values API to table async filter options (`skip/limit` to `offset/limit`) |
| `createStaticFilterOptions`   | `utils/filters/createStaticFilterOptions.util.ts`   | Wraps a `string[]` into a `FilterOptionsResponse`-compatible paginated object               |

### `src/utils/globalSettings/`

| Function                                 | Location                                                        | Description                                                                            |
| ---------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `getGlobalSettingsFromCookie`            | `utils/globalSettings/getGlobalSettingsFromCookie.util.ts`      | Reads global settings (pinning + navigation preferences) from cookie string (SSR-safe) |
| `serializeGlobalSettingsForCookie`       | `utils/globalSettings/serializeGlobalSettingsForCookie.util.ts` | Serialises `GlobalSettingsState` to versioned JSON payload for cookie write            |
| `GLOBAL_SETTINGS_COOKIE_KEY`             | `utils/globalSettings/globalSettings.constants.ts`              | Cookie key constant (`global-settings`)                                                |
| `GLOBAL_SETTINGS_COOKIE_VERSION`         | `utils/globalSettings/globalSettings.constants.ts`              | Current payload version; incremented on breaking schema changes                        |
| `*_VALUES` constants                     | `utils/globalSettings/globalSettings.constants.ts`              | Valid-value arrays (pin side, conflict resolutions, navigation prefs) backing guards   |
| `toGlobalPinningPreferences`             | `utils/globalSettings/toGlobalPinningPreferences.util.ts`       | Parses/validates the `pinning` cookie payload slice (internal)                         |
| `toGlobalNavigationPreferences`          | `utils/globalSettings/toGlobalNavigationPreferences.util.ts`    | Parses/validates the `navigation` cookie payload slice (internal)                      |
| `is*Preference` / `is*Resolution` guards | `utils/globalSettings/is*.util.ts`                              | One type guard per preference value set, each in its own file with unit tests          |

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

### `src/utils/performance/`

| Function              | Location                                  | Description                                                                      |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `trackRender`         | `utils/performance/renderTracker.util.ts` | Records a render event for a named component (dev-only)                          |
| `trackRenderComplete` | `utils/performance/renderTracker.util.ts` | Marks a render complete with timing; pairs with `trackRender`                    |
| `renderStats`         | `utils/performance/renderTracker.util.ts` | Object of methods to query/reset accumulated render counts and timing (dev-only) |

### `src/utils/prefetch/`

| Function                  | Location                                         | Description                                                                 |
| ------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `resolveFromCacheOrFetch` | `utils/prefetch/resolveFromCacheOrFetch.util.ts` | Resolves from prefetch cache (hit/in-flight) or falls back to a fresh fetch |
| `prefetchNextPage`        | `utils/prefetch/prefetchNextPage.util.ts`        | _Internal_: Creates prefetch request (used by `firePrefetch`)               |
| `firePrefetch`            | `utils/prefetch/firePrefetch.util.ts`            | Fires prefetch and applies result to a ref with staleness check             |

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

| Function              | Location                                    | Description                                                                       |
| --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `buildCookieString`   | `utils/storage/buildCookieString.util.ts`   | Serialises key/value to a `Set-Cookie` string (1y expiry, `SameSite=Lax`)         |
| `parseCookies`        | `utils/storage/parseCookies.util.ts`        | _Internal_: Used by `readFromCookie` and `writeToCookie`                          |
| `readFromCookie`      | `utils/storage/readFromCookie.util.ts`      | Reads a named cookie value from `document.cookie` or a provided string (SSR-safe) |
| `writeToCookie`       | `utils/storage/writeToCookie.util.ts`       | Writes a cookie via `document.cookie` or returns a `Set-Cookie` header (SSR-safe) |
| `writeToLocalStorage` | `utils/storage/writeToLocalStorage.util.ts` | Writes to `localStorage` with error handling for quota/disabled scenarios         |

### `src/utils/urlState/`

| Function                    | Location                                           | Description                                                                           |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------- |
| `encodeStateToURL`          | `utils/urlState/encodeStateToURL.util.ts`          | Serialises a state object to a Base64 URL-safe string (converts `Set` → `Array`)      |
| `decodeStateFromURL`        | `utils/urlState/decodeStateFromURL.util.ts`        | Deserialises a Base64 URL-safe string back to a state object                          |
| `readStateFromURL`          | `utils/urlState/readStateFromURL.util.ts`          | Reads + decodes a single key from `URLSearchParams`                                   |
| `readTableStateFromURL`     | `utils/urlState/readTableStateFromURL.util.ts`     | Convenience wrapper: reads sorting, filters, and column-visibility state from the URL |
| `serializeFiltersToURL`     | `utils/urlState/serializeFiltersToURL.util.ts`     | `ColumnFiltersState` → compact JSON using operator short-codes                        |
| `serializeFilter`           | `utils/urlState/serializeFilter.util.ts`           | Dispatches a single `ColumnFilter` to the matching leaf serializer                    |
| `serializeBooleanFilter`    | `utils/urlState/serializeBooleanFilter.util.ts`    | Serializes boolean filters as bare booleans                                           |
| `serializeDateFilter`       | `utils/urlState/serializeDateFilter.util.ts`       | Serializes date filters using compact operator codes and optional range values        |
| `serializeSelectFilter`     | `utils/urlState/serializeSelectFilter.util.ts`     | Serializes select and multi-select filters to compact arrays                          |
| `serializeNumberFilter`     | `utils/urlState/serializeNumberFilter.util.ts`     | Serializes number filters using compact operator codes and optional range values      |
| `serializeTextFilter`       | `utils/urlState/serializeTextFilter.util.ts`       | Serializes text filters to compact operator/value arrays                              |
| `getSerializedOperator`     | `utils/urlState/getSerializedOperator.util.ts`     | Maps long operator names to short codes via `OPERATOR_TO_SHORT`                       |
| `deserializeFiltersFromURL` | `utils/urlState/deserializeFiltersFromURL.util.ts` | Compact URL param → full `ColumnFiltersState`                                         |
| `deserializeFilter`         | `utils/urlState/deserializeFilter.util.ts`         | Deserialises a single compact filter value with type inference                        |
| `serializeSortingToURL`     | `utils/urlState/serializeSortingToURL.util.ts`     | `SortingState[]` → compact `{ [key]: 'asc'                                            | 'desc' }` object |
| `deserializeSortingFromURL` | `utils/urlState/deserializeSortingFromURL.util.ts` | Compact sorting URL param → `SortingState[]`                                          |

### `src/routes/utils/`

| Function                          | Location                                               | Description                                                                                              |
| --------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `readTableLoaderStateFromRequest` | `routes/utils/readTableLoaderStateFromRequest.util.ts` | Shared loader bootstrap from URL + cookie state for table-backed routes                                  |
| `sanitizeSorting`                 | `routes/utils/sanitizeSorting.util.ts`                 | Strips undefined-direction and `'actions'`-keyed entries from a SortingState before passing to API calls |

---

## Constants

| Export(s)                                                                                                                                                            | Location                                            | Description                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| `OPERATOR_TO_SHORT`, `SHORT_TO_OPERATOR`, `TEXT_OPERATORS`, `NUMBER_OPERATORS`, `DATE_OPERATORS`, …                                                                  | `constants/filterOperators.constants.ts`            | Bidirectional operator ↔ short-code maps and operator arrays per data type        |
| `DEFAULT_CONTAINER_HEIGHT`, `DEFAULT_ROW_OVERSCAN`                                                                                                                   | `constants/virtualization.constants.ts`             | Default dimensions and row overscan values for virtualization hooks               |
| `DEFAULT_LOCALE`, `DEFAULT_CURRENCY`, `DEFAULT_DATE_PRESET`                                                                                                          | `utils/formatters/formatters.constants.ts`          | Formatting defaults (`en-US`, `USD`, `medium`)                                    |
| `INITIAL_PAGE_SIZE`, `LOAD_MORE_PAGE_SIZE`, `DEFAULT_FILTER_PAGE_SIZE`, `DEFAULT_ENABLE_PREFETCH`, …                                                                 | `components/Table/Table.constants.ts`               | Table pagination sizes, prefetch toggle, scroll threshold, column widths          |
| `NAVIGATION_SIZE_PREFERENCE_OPTIONS`                                                                                                                                 | `constants/globalSettings.constants.ts`             | Labelled option array for global navigation sizing (`compact/small/medium/large`) |
| `ORDER_CONFLICT_OPTIONS`, `ORDER_CONFLICT_PREFERENCE_OPTIONS`, `PIN_SIDE_PREFERENCE_OPTIONS`, `PIN_CONFLICT_PREFERENCE_OPTIONS`, `UNPIN_CONFLICT_PREFERENCE_OPTIONS` | `constants/pinningPreferences.constants.ts`         | Labelled option arrays for pinning runtime modals and preference radio groups     |
| `NO_AUTOFILL_INPUT_PROPS`                                                                                                                                            | `components/Table/filters/filterInput.constants.ts` | Shared anti-autofill/autocomplete input attributes for filter `<input>` elements  |

---

## Types

| Key Exports                                                                                                                                                                                                                             | Location                            | Description                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `DesignSystemColor`, `DesignSystemSize`, `DesignSystemOrientation`, `DesignSystemStyle`, `DesignSystemWidth`                                                                                                                            | `types/design-system.types.ts`      | Union types for all design-system prop values                                                 |
| `BooleanFilter`, `DateFilter`, `NumberFilter`, `SelectFilter`, `TextFilter`, `ColumnFilter`                                                                                                                                             | `types/filterOperators.types.ts`    | Discriminated union for all column filter states                                              |
| `DateFormatPreset`, `DateFormatOptions`, `CurrencyFormatOptions`, `NumberFormatOptions`                                                                                                                                                 | `types/format.types.ts`             | Options for the formatter utilities                                                           |
| `ThemeMode`, `ThemeContextValue`                                                                                                                                                                                                        | `types/theme.types.ts`              | Light/dark mode enum and context shape                                                        |
| `InfiniteScroll`, `Pagination`, `PinSide`, `SortDirection`, `Sorting`, `PinConflictState`, `PrefetchCache`                                                                                                                              | `types/ui.types.ts`                 | Shared UI primitive types                                                                     |
| `OrderConflictResolution`, `OrderConflictResolutionPreferenceOption`, `PinConflictResolution`, `PinSidePreferenceOption`, `PinConflictResolutionPreferenceOption`, `UnpinConflictResolution`, `UnpinConflictResolutionPreferenceOption` | `types/pinningPreferences.types.ts` | Pinning prompt resolution unions and preference option unions including `always-ask` sentinel |
| `GlobalNavigationPreferences`, `GlobalNavigationSizePreference`, `GlobalPinningPreferences`, `GlobalSettingsState`                                                                                                                      | `types/globalSettings.types.ts`     | Global settings state shape (navigation + pinning) persisted in `global-settings` cookie      |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
