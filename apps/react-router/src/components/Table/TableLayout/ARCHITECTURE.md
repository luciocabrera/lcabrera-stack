# TableLayout Architecture

Top-level entry point for route-based table usage. Sets up all context
providers, wraps data fetching in Suspense, and renders the `Table`
component with resolved data.

## File Structure

```
TableLayout/
├── TableLayout.component.tsx   → Provider stack + Suspense + Table
├── TableLayout.types.ts        → TableLayoutProps (columns, dataPromise, config, ...)
├── TableLayout.stylex.ts       → Container styles
├── createLazyTableLayout.ts    → Optional lazy loader factory (direct import only)
└── index.ts                    → Barrel export
```

## Public API

- `index.ts` exports only `TableLayout` and `TableLayoutProps`.
- `createLazyTableLayout` must be imported directly from
  `./createLazyTableLayout` to avoid mixing static and dynamic imports of
  `TableLayout.component.tsx` in the same barrel path.

## Provider Stack

```mermaid
graph TD
  TL["TableLayout"] --> container["div.container"]
  container --> TCP["TableConfigProvider (columnsState + metaState)"]
  TCP --> FDP["FiltersDataProvider (columns)"]
  FDP --> TSB["TableSuspenseBoundary (key=suspenseKey)"]
  TSB -->|pending| SK["TableSkeleton"]
  TSB -->|resolved| TDR["TableDataResolver"]
  TDR --> T["Table (dataSelector, dataTotalSelector, onLoadMore, response)"]

  style TSB stroke-dasharray: 5 5
```

## Props

| Prop                   | Type                        | Required | Description                              |
| ---------------------- | --------------------------- | -------- | ---------------------------------------- |
| `columns`              | `TableColumn<TData>[]`      | Yes      | Column definitions                       |
| `dataPromise`          | `Promise<TResponse>`        | Yes      | Async data source                        |
| `dataSelector`         | `(r: TResponse) => TData[]` | Yes      | Extract rows from response               |
| `title`                | `string`                    | Yes      | Table display title                      |
| `persistenceKey`       | `string`                    | Yes      | Cookie/URL persistence namespace         |
| `suspenseKey`          | `string?`                   | No       | Key to reset Suspense boundary           |
| `columnOrder`          | `ColumnOrderState?`         | No       | Initial column order                     |
| `columnPinning`        | `ColumnPinningState?`       | No       | Initial pinning                          |
| `columnSizing`         | `ColumnSizingState?`        | No       | Initial column widths                    |
| `columnVisibility`     | `ColumnVisibilityState?`    | No       | Initially hidden columns                 |
| `filters`              | `ColumnFiltersState?`       | No       | Active filters                           |
| `sorting`              | `SortingState?`             | No       | Active sorting                           |
| `density`              | `TableDensity`              | No       | Default: `comfortable`                   |
| `isBordered`           | `boolean`                   | No       | Default: `true`                          |
| `isStriped`            | `boolean`                   | No       | Default: `true`                          |
| `onLoadMore`           | Infinite scroll callback    | No       | Fetch next page                          |
| `dataTotalSelector`    | `(r: TResponse) => number`  | No       | Extract total row count                  |
| `defaultColumnPinning` | `ColumnPinningState?`       | No       | Fallback pinning when no persisted state |

## suspenseKey Behavior

Setting `key={suspenseKey}` on `TableSuspenseBoundary` allows the data
boundary to remount (triggering skeleton fallback) without destroying
`TableConfigProvider` or `FiltersDataProvider` above it. This preserves
column config and filter dropdown data across data navigations.
