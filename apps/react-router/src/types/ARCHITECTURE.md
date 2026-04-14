# types/ Architecture

Shared TypeScript types used across components, hooks, and utilities.

## File Index

| File                       | Contents                                                 | Complexity      |
| -------------------------- | -------------------------------------------------------- | --------------- |
| `filterOperators.types.ts` | `ColumnFilter` union + per-type operator enums           | ★★★ core domain |
| `ui.types.ts`              | Cross-cutting UI contracts: pagination, sorting, pinning | ★★ shared       |
| `design-system.types.ts`   | Design token string unions (color, size, style, width)   | ★ trivial       |
| `format.types.ts`          | Option bags for date/number/currency formatters          | ★ trivial       |
| `theme.types.ts`           | `ThemeMode`, `ThemeContextValue`                         | ★ trivial       |
| `api.types.ts`             | `ApiConfig` environment host map                         | ★ trivial       |

---

## `filterOperators.types.ts`

Defines the `ColumnFilter` discriminated union and all operator enums. Consumed by Table column filters, `VirtualList`, and `VirtualSelect`.

### `ColumnFilter` union

```ts
type ColumnFilter =
  | BooleanFilter
  | DateFilter
  | NumberFilter
  | SelectFilter
  | TextFilter;
```

Discriminated on the `type` field:

| `type`                       | Interface       | Operators                                                                                      | `value`           | `value2`                         |
| ---------------------------- | --------------- | ---------------------------------------------------------------------------------------------- | ----------------- | -------------------------------- |
| `'boolean'`                  | `BooleanFilter` | _(none)_                                                                                       | `boolean`         | —                                |
| `'date'`                     | `DateFilter`    | `equals` `before` `after` `between`                                                            | ISO date string   | ISO date string (`between` only) |
| `'number'`                   | `NumberFilter`  | `equals` `notEquals` `greaterThan` `greaterThanOrEqual` `lessThan` `lessThanOrEqual` `between` | `number`          | `number` (`between` only)        |
| `'select'` / `'multiSelect'` | `SelectFilter`  | `equals` `notEquals` _(optional)_                                                              | `string` (single) | —                                |
| `'text'`                     | `TextFilter`    | `contains` `notContains` `equals` `notEquals` `startsWith` `endsWith`                          | `string`          | —                                |

### `SelectFilter` notes

`SelectFilter` covers both single and multi-select patterns via its `type` discriminant:

| `type`          | Field used | Usage                     |
| --------------- | ---------- | ------------------------- |
| `'select'`      | `value?`   | Single selected string    |
| `'multiSelect'` | `values?`  | Array of selected strings |

`operator` is optional and defaults to `'equals'` if omitted.

### Operator type aliases

| Alias                | Resolves to                                                  |
| -------------------- | ------------------------------------------------------------ |
| `TextOperatorType`   | `'contains' \| 'notContains' \| 'equals' \| ...`             |
| `NumberOperatorType` | `'equals' \| 'notEquals' \| 'greaterThan' \| ...`            |
| `DateOperatorType`   | `'equals' \| 'before' \| 'after' \| 'between'`               |
| `OperatorType`       | `TextOperatorType \| NumberOperatorType \| DateOperatorType` |

`OperatorOption<T>` is a generic `{ label: string; value: T }` pair used to populate operator dropdowns in filter UIs.

---

## `ui.types.ts`

Cross-cutting contracts shared by Table, VirtualList, and hooks.

### `Sorting<TData>`

```ts
type Sorting<TData = Record<string, unknown>> = {
  columnKey: DataKey<TData>;
  direction?: SortDirection; // 'asc' | 'desc' | undefined
};
```

`direction: undefined` means "no sort applied". Used by Table state and `useGetColumnSorting` / `useSetColumnSorting`.

### `SortDirection`

```ts
type SortDirection = 'asc' | 'desc' | undefined;
```

`undefined` represents the cleared/neutral state — not just an optional field.

### `PinSide`

```ts
type PinSide = 'left' | 'right' | 'closest-edge';
```

| Value            | Meaning                                                  |
| ---------------- | -------------------------------------------------------- |
| `'left'`         | Pin to the left side explicitly                          |
| `'right'`        | Pin to the right side explicitly                         |
| `'closest-edge'` | Resolve to the nearest edge at drop time (drag-and-drop) |

### `PinConflictState`

```ts
type PinConflictState = { isOpen: boolean; side: 'left' | 'right' };
```

Drives the pin-conflict confirmation dialog in `TableSettingsDrawer`.

### `Pagination`

```ts
type Pagination = { limit: number; skip: number };
```

Offset-based pagination params passed to `InfiniteScroll.onLoadMore`.

### `InfiniteScroll<TData, TResponse>`

```ts
type InfiniteScroll<TData, TResponse> = {
  dataSelector?: (response: TResponse) => TData[];
  dataTotalSelector?: (response: TResponse) => number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: (params: Pagination) => Promise<TResponse>;
};
```

| Field               | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `onLoadMore`        | Fetches the next page; receives `{ limit, skip }`               |
| `dataSelector`      | Extracts the `TData[]` array from the raw API response          |
| `dataTotalSelector` | Extracts the total item count (for "Loaded: x / total" display) |
| `hasMore`           | Whether more pages exist                                        |
| `isLoadingMore`     | Loading state for the next-page fetch                           |

### `LayoutProps`

```ts
type LayoutProps = { children: ReactNode };
```

Minimal prop type for layout wrapper components.

---

## `design-system.types.ts`

String union types that map directly to design token variants. Consumed by `Button`, `Tag`, `SidePanel`, and other UI primitives.

| Type                      | Values                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `DesignSystemColor`       | `'primary'` `'secondary'` `'ghost'` `'outline'` `'danger-ghost'` `'error'` `'success'` `'warning'` |
| `DesignSystemSize`        | `'mini'` `'sm'` `'md'` `'lg'` `'embedded'`                                                         |
| `DesignSystemStyle`       | `'flat'` `'solid'` `'elevated'`                                                                    |
| `DesignSystemWidth`       | `'auto'` `'full'`                                                                                  |
| `DesignSystemOrientation` | `'horizontal'` `'vertical'`                                                                        |

---

## `format.types.ts`

Option bags for formatter utilities. All fields are optional locale/preset overrides.

| Type                    | Fields                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `DateFormatOptions`     | `locale?`, `preset?: DateFormatPreset`                        |
| `DateFormatPreset`      | `'short'` `'medium'` `'long'` `'full'`                        |
| `NumberFormatOptions`   | `locale?`, `minimumFractionDigits?`, `maximumFractionDigits?` |
| `CurrencyFormatOptions` | `locale?`, `currency?` (ISO 4217, e.g. `'USD'`)               |

---

## `theme.types.ts`

| Type                | Fields                                                   |
| ------------------- | -------------------------------------------------------- |
| `ThemeMode`         | `'light' \| 'dark'`                                      |
| `ThemeContextValue` | `theme`, `isDarkMode`, `setTheme(mode)`, `toggleTheme()` |

Consumed exclusively via `useTheme()`. See `hooks/ARCHITECTURE.md`.

---

## `api.types.ts`

```ts
type ApiConfig = {
  localhost: { apiHost: string };
  dev: { apiHost: string };
  prod: { apiHost: string };
};
```

Maps deployment environments to their API host URLs. Used by the app-level config loader.
