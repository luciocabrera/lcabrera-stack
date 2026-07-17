# hooks/ Architecture

Custom React hooks shared across the application.

## File Structure

```
hooks/
├── index.ts                              → Barrel export
├── useClickOutside.hook.ts               → Detect mousedown outside a DOM element
├── useColumnVirtualization.hook.ts       → Horizontal virtual-scroll geometry computation
├── useElementSize.hook.ts                → Track a ref element's client size via ResizeObserver (SSR-safe)
├── useInfiniteScrollObserver.hook.ts     → IntersectionObserver sentinel trigger for infinite scroll
├── useNotifyOnError.hook.ts              → Fire error toast whenever error identity changes
├── useResizeObserver.hook.ts             → Low-level ResizeObserver lifecycle (lazy target, deferred initial measure, SSR-safe)
├── useStore.hook.ts                      → Lightweight external store (useSyncExternalStore-compatible)
├── useStoreSelector.hook.ts              → Subscribe to a slice of a useStore store (shared useSyncExternalStore wiring)
├── useTheme.hook.ts                      → Access ThemeContext via React 19 use()
├── useVirtualization.hook.ts             → Vertical virtual-scroll geometry computation (ResizeObserver-based)
└── utils/
  ├── ARCHITECTURE.md                   → Hook-local utility architecture
  ├── findFirstOutOfViewIndex.util.ts   → Binary search for first start >= viewport end
  ├── findFirstVisibleIndex.util.ts     → Binary search for first right-edge > viewport start
  └── index.ts                          → Utility barrel exports
```

## Hook Summary

| Hook                        | Category      | Returns                                        | Key dependency                                |
| --------------------------- | ------------- | ---------------------------------------------- | --------------------------------------------- |
| `useClickOutside`           | DOM event     | `void`                                         | `document` mousedown                          |
| `useColumnVirtualization`   | Layout/scroll | `{ startIndex, endIndex, leftSpacerWidth, … }` | `ResizeObserver` + scroll events on container |
| `useElementSize`            | Layout        | `{ height, width }`                            | `useResizeObserver` on the ref element        |
| `useResizeObserver`         | Layout        | `void`                                         | `ResizeObserver` on a lazily-resolved target  |
| `useInfiniteScrollObserver` | Layout/scroll | `void`                                         | `IntersectionObserver` on a sentinel element  |
| `useNotifyOnError`          | Notification  | `void`                                         | `useNotifyAction`, `useEffect`                |
| `useStore`                  | State mgmt    | `TStore<TData>`                                | `useRef`, `shallowEqual`                      |
| `useStoreSelector`          | State mgmt    | `TSelected`                                    | `useSyncExternalStore`, `TStore`              |
| `useTheme`                  | Context       | `ThemeContextValue`                            | `ThemeContext`, `use()`                       |
| `useVirtualization`         | Layout/scroll | `{ startIndex, endIndex, offsetY, … }`         | `ResizeObserver` + RAF-batched scroll events  |

---

## `useClickOutside`

Fires `onClickOutside` whenever a `mousedown` event occurs outside `ref.current`.

### Signature

```ts
useClickOutside({ ref, onClickOutside }): void
```

### Flow

```mermaid
graph TD
  Mount["useEffect mounts"] --> Add["document.addEventListener('mousedown', handler)"]
  Add --> Event["mousedown fires anywhere"]
  Event --> Check{"ref.current.contains(event.target)?"}
  Check -->|no| Call["onClickOutside()"]
  Check -->|yes| Ignore["(no-op)"]
  Unmount["useEffect cleanup"] --> Remove["document.removeEventListener(...)"]
```

### Args

| Field            | Type                             | Description                       |
| ---------------- | -------------------------------- | --------------------------------- |
| `ref`            | `RefObject<HTMLElement \| null>` | Element whose boundary is guarded |
| `onClickOutside` | `() => void`                     | Called on outside mousedown       |

> Both `ref` and `onClickOutside` are dependencies of the `useEffect`. Consumers should stabilise `onClickOutside` with `useCallback` to avoid re-registering the listener on every render.

---

## `useColumnVirtualization`

Computes the horizontal virtual-scroll window for a list of columns with
variable widths. Mirrors the geometry logic of `useVirtualization` but for
the X-axis and variable-width items.

Implementation details:

- Initializes `containerWidth` from `containerRef.current.offsetWidth` when
  available, falling back to `defaultContainerWidth` only when measurement is
  unavailable.
- Uses isomorphic layout effect so initial width/scroll sync runs before paint
  on the client, reducing first-frame layout shift.
- Attempts an immediate `offsetWidth` measurement on mount (fast path); falls
  through when the measurement returns 0 (e.g. due to CSS `container-type:size`
  containment on an ancestor requiring an extra browser layout pass).
- Installs a `ResizeObserver` on the container element instead of listening to
  `window.resize`. `ResizeObserver` fires after the browser resolves layout
  (including containment passes), covers initial mount, and tracks container
  size changes that do not trigger a window resize (sidebar toggles, panel
  resizes, etc.).
- Syncs initial `scrollLeft` on mount so restored horizontal position is
  reflected before first user interaction.
- Uses a passive scroll listener to avoid blocking native scrolling.
- Batches scroll-driven `scrollLeft` updates with `requestAnimationFrame` to
  reduce re-render pressure during rapid horizontal scrolling.
- Reuses `setupObservedContainer()` from `hooks/utils` for shared
  ResizeObserver + scroll subscription wiring.
- Memoizes cumulative column start offsets and resolves visible boundaries via
  binary search.
- Binary-search logic is extracted to `hooks/utils/` as reusable pure utils.

### Signature

```ts
useColumnVirtualization(args: UseColumnVirtualizationArgs): UseColumnVirtualizationReturn
```

### `UseColumnVirtualizationArgs`

| Field                   | Type                             | Default | Description                                     |
| ----------------------- | -------------------------------- | ------- | ----------------------------------------------- |
| `columnWidths`          | `readonly number[]`              | —       | Pixel widths of the non-pinned (center) columns |
| `containerRef`          | `RefObject<HTMLElement \| null>` | —       | Scrollable container element                    |
| `defaultContainerWidth` | `number`                         | `800`   | Fallback width before DOM measurement           |
| `overscan`              | `number`                         | `2`     | Extra columns rendered beyond each visible edge |

### `UseColumnVirtualizationReturn`

| Field              | Type     | Description                                               |
| ------------------ | -------- | --------------------------------------------------------- |
| `startIndex`       | `number` | First rendered center-column index (inclusive)            |
| `endIndex`         | `number` | Last rendered center-column index (exclusive)             |
| `leftSpacerWidth`  | `number` | Pixel width of the spacer cell inserted before the window |
| `rightSpacerWidth` | `number` | Pixel width of the spacer cell inserted after the window  |
| `totalWidth`       | `number` | Sum of all center-column widths                           |

### Geometry

```
←──────────────── totalWidth ─────────────────→
┌──────────────────────────────────────────────┐
│ [skipped]  │  rendered window  │  [skipped]  │
│← leftSpacer→← startIdx…endIdx →← rightSpacer→│
└──────────────────────────────────────────────┘
       ↑ container viewport ↑
```

### Usage in `TableHeader` / `TableBody`

```tsx
const { startIndex, endIndex, leftSpacerWidth, rightSpacerWidth } =
  useColumnVirtualization({
    columnWidths,
    containerRef,
    overscan,
  });

// Per row:
[
  ...leftPinnedCells,
  leftSpacerWidth > 0 && <SpacerCell width={leftSpacerWidth} />,
  ...centerCols.slice(startIndex, endIndex).map(renderCell),
  rightSpacerWidth > 0 && <SpacerCell width={rightSpacerWidth} />,
  ...rightPinnedCells,
];
```

---

## `useVirtualization`

Computes the vertical virtual-scroll window for fixed-height rows. This is the
current default implementation used by the table.

Implementation details:

- Initializes `containerHeight` from `containerRef.current.offsetHeight` on
  mount, falling back to `defaultContainerHeight` only when measurement is
  unavailable.
- Installs a `ResizeObserver` on the scroll container instead of listening to
  `window.resize`, so container-only size changes are tracked correctly.
- Uses a passive scroll listener and batches `scrollTop` updates with
  `requestAnimationFrame` to reduce re-render pressure during rapid scrolling.
- Reuses `setupObservedContainer()` from `hooks/utils` for shared
  ResizeObserver + scroll subscription wiring (the observer is skipped when
  `ResizeObserver` is unavailable, keeping SSR and tests safe).
- Preserves the previous non-zero height when a resize temporarily reports `0`
  (for example hidden/inactive layouts).

### Signature

```ts
useVirtualization(args: UseVirtualizationArgs)
```

### `UseVirtualizationArgs`

| Field                    | Type                             | Default | Description                            |
| ------------------------ | -------------------------------- | ------- | -------------------------------------- |
| `containerRef`           | `RefObject<HTMLElement \| null>` | —       | Scrollable container element           |
| `defaultContainerHeight` | `number`                         | `400`   | Fallback height before DOM measurement |
| `itemHeight`             | `number`                         | —       | Fixed row height in pixels             |
| `overscan`               | `number`                         | `3`     | Extra rows rendered above and below    |
| `totalItems`             | `number`                         | —       | Total number of virtualized rows       |

### Return Shape

`useVirtualization` returns:

- `startIndex` / `endIndex`: visible row window
- `offsetY`: top virtual offset in pixels
- `bottomSpacerHeight`: remaining virtual height below the rendered window
- `totalHeight`: full logical height of the row list
- `containerHeight` / `visibleCount`: current viewport geometry

### Geometry

```
scrollTop ──► startIndex / endIndex
              │
              ├─► offsetY
              └─► bottomSpacerHeight
```

---

## `useStore`

Creates a ref-based external store that is compatible with `useSyncExternalStore`. Uses shallow equality to suppress no-op updates.

### Signature

```ts
useStore<TData extends Record<string, unknown>>(initialState: TData): TStore<TData>
```

`initialState` is **required**, which is what lets `get()` return `TData` rather
than `TData | undefined`. A store is never empty, so no reader needs an
empty-store fallback or a cast — the `?? ({} as SomeState)` defaults that habit
produced were unreachable, and one of them (`{} as ColumnVisibilityState`, a
`Set`) was actively wrong.

### `TStore<TData>` interface

| Method                | Signature                         | Description                                                     |
| --------------------- | --------------------------------- | --------------------------------------------------------------- |
| `get()`               | `() => TData`                     | Returns current state — never undefined; the store is seeded    |
| `getServerSnapshot()` | `() => TData`                     | Returns **initial** state — used by SSR hydration               |
| `set(partial)`        | `(value: Partial<TData>) => void` | Merges partial update; notifies listeners only if state changed |
| `reset()`             | `() => void`                      | Restores state to `initialState`; always notifies               |
| `subscribe(cb)`       | `(cb: () => void) => () => void`  | Registers a listener; returns unsubscribe function              |

### Internal Structure

```mermaid
graph TD
  useStore --> store_ref["store (useRef) — current state"]
  useStore --> initial_ref["initialRef (useRef) — immutable snapshot for SSR"]
  useStore --> listeners_ref["listeners (useRef<Set>) — subscriber callbacks"]

  set --> shallowEqual["shallowEqual(prev, next)"]
  shallowEqual -->|"changed"| notify["notify all listeners"]
  shallowEqual -->|"same"| noop["(no-op)"]

  reset --> restore["store.current = initialRef.current"]
  restore --> notify2["notify all listeners"]
```

### Update Flow

```mermaid
graph LR
  Caller["store.set({ key: value })"] --> Merge["{ ...prev, ...partial }"]
  Merge --> EqualCheck{"shallowEqual(prev, next)?"}
  EqualCheck -->|"equal"| Skip["skip — no re-render"]
  EqualCheck -->|"different"| Write["store.current = next"]
  Write --> Notify["forEach listener → callback()"]
  Notify --> Rerender["useSyncExternalStore re-renders subscribers"]
```

### Canonical Usage

```tsx
const store = useStore<{ count: number }>({ count: 0 });

// Read through useStoreSelector rather than wiring useSyncExternalStore by hand
const count = useStoreSelector({ selector: (state) => state.count, store });

store.set({ count: count + 1 });
```

### Design Notes

- **No React state** — the store lives in `useRef`, so mutations never cause the owning component to re-render directly.
- **Shallow equality guard** prevents `set` from notifying listeners when the merged object is identical to the previous state.
- **`getServerSnapshot`** always returns the `initialState` snapshot, satisfying React's SSR hydration contract.
- The listener `Set` is also a ref, so subscribe/unsubscribe operations are stable across renders.

---

## `useStoreSelector`

Subscribes to a slice of a `useStore` store. This is the read half of the store
pattern — `useStore` creates the store, `useStoreSelector` reads from it — and
it owns the `useSyncExternalStore` wiring (client snapshot, server snapshot,
subscribe) so no per-context hook repeats it.

### Signature

```ts
useStoreSelector<TState extends Record<string, unknown>, TSelected>(args: {
  selector: (state: TState) => TSelected;
  store: TStore<TState>;
}): TSelected
```

`useStore` requires an initial state, so `get()` always returns one. There is no
empty-store fallback and no cast — a selector always receives real state.

### Consumers

This hook owns **every** `useSyncExternalStore` call in the package. Each
per-context `use*Store` infrastructure hook resolves its own store from its own
context and delegates here:

| Hook                                             | Context                     |
| ------------------------------------------------ | --------------------------- |
| `TableConfig/columns/useColumnsStore`            | `TableConfigContext`        |
| `TableConfig/meta/useMetaStore`                  | `TableConfigContext`        |
| `TableData/data/useDataStore`                    | `TableDataContext`          |
| `FiltersData/filters/useFiltersStore`            | `FiltersDataContext`        |
| `TableSettingsDrawer/.../useColumnsStore`        | `TableDrawerContext`        |
| `ColumnSettingsDrawer/.../useColumnsStore`       | `ColumnDrawerContext`       |
| `ColumnOrderSection/.../useModalsStore`          | `ColumnOrderSectionContext` |
| `Form/contexts/FormContext/useFieldsStore`       | `FormContext`               |
| `Form/contexts/FormContext/useMetaStore`         | `FormContext`               |
| `Settings/SettingsDraftContext/useDraftStore`    | `SettingsDraftContext`      |
| `VirtualList/contexts/list/useListStore`         | `VirtualListContext`        |
| `VirtualList/contexts/data/useListDataStore`     | `VirtualListContext`        |
| `VirtualSelect/contexts/meta/useSelectMetaStore` | `VirtualSelectContext`      |
| `GlobalSettingsContext/useGlobalSettingsStore`   | `GlobalSettingsContext`     |
| `NotificationContext/useNotificationStore`       | `NotificationContext`       |

Each hook types its selector against **its own store's state** — the drawer
stores hold a narrower slice than `TableConfig`, and typing them against the
full `TableColumnsState` would let selectors read fields the store never holds.

### Design Notes

- **Re-render granularity comes from the selector's _result_, not the store.**
  `useStore.set` notifies on any change, so the selector re-runs on every
  update; `useSyncExternalStore` then compares the result with `Object.is` and
  skips the re-render when it is unchanged. Selecting a primitive is therefore
  stable, while a selector building a **new object/array each call re-renders on
  every store write** — select stored values, not freshly-derived containers.
- Selector hooks (`useGet*`) are the intended consumers; view components read
  through those, never through this hook directly.

---

## `useTheme`

Accesses `ThemeContext` using React 19's `use()` API. Throws if called outside `ThemeProvider`.

### Signature

```ts
useTheme(): ThemeContextValue
```

### `ThemeContextValue`

| Field         | Type                         | Description                           |
| ------------- | ---------------------------- | ------------------------------------- |
| `theme`       | `'light' \| 'dark'`          | Current active theme                  |
| `isDarkMode`  | `boolean`                    | Convenience flag — `theme === 'dark'` |
| `setTheme`    | `(theme: ThemeMode) => void` | Set theme explicitly                  |
| `toggleTheme` | `() => void`                 | Toggle between `'light'` and `'dark'` |

### Flow

```mermaid
graph TD
  A["useTheme() called"] --> B["use(ThemeContext)"]
  B --> C{"context === undefined?"}
  C -->|yes| D["throw Error('useTheme must be used within a ThemeProvider')"]
  C -->|no| E["return ThemeContextValue"]
```

### Dependencies

```mermaid
graph LR
  useTheme --> ThemeContext["ThemeContext (React context)"]
  useTheme --> ThemeContextValue["ThemeContextValue (type)"]
  ThemeContext --> ThemeProvider["ThemeContext.provider.tsx"]
```

### Design Note

Uses `use(ThemeContext)` (React 19) rather than `useContext`. This enables calling the hook inside conditional branches and Suspense boundaries where `useContext` is not allowed.
