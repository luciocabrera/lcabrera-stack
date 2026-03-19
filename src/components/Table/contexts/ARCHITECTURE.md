# Table Contexts Architecture

Four context providers that together manage all table state. Each context
owns one or more external stores (except TableWrapper which holds a ref).

## File Structure

```
contexts/
├── index.ts                    → Barrel: FiltersDataProvider, TableConfigProvider, TableDataProvider
│
├── FiltersData/                → Filter lookup data per column (survives Suspense)
│   ├── FiltersDataContext.*     → Context, Provider, Types
│   └── filters/                → 1 store, 2 actions, 1 selector, 1 util
│
├── TableConfig/                → Column settings + UI meta (dual-store)
│   ├── TableConfigContext.*     → Context, Provider, Types
│   ├── columns/                → 1 store, 10 actions, 12 selectors
│   ├── meta/                   → 1 store, 3 actions, 11 selectors
│   └── utils/                  → getInitialColumnsState, getInitialMetaState
│
├── TableData/                  → Row data + loading + pagination
│   ├── TableDataContext.*       → Context, Provider, Types
│   ├── data/                   → 1 store, 1 action, 4 selectors
│   └── utils/                  → getInitialDataState
│
└── TableWrapper/               → Ref-based context for wrapper DOM access
    ├── TableWrapperContext.*    → Context, Types
    └── useTableWrapperRef      → Hook to consume the ref
```

## Provider Nesting

```mermaid
graph TD
  TL["TableLayout"] --> TCP["TableConfigProvider"]
  TCP --> FDP["FiltersDataProvider"]
  FDP --> TSB["TableSuspenseBoundary (Suspense)"]
  TSB --> T["Table"]
  T --> TDP["TableDataProvider"]
  TDP --> TC["TableContent"]
  TC --> TWC["TableWrapperContext"]
  TWC --> Children["TableHeader + TableBody + Drawers"]

  style TSB stroke-dasharray: 5 5
```

**Why this order matters:**

- **TableConfigProvider** is outermost — column definitions and meta config
  are stable across data fetches
- **FiltersDataProvider** sits above Suspense — filter dropdown options survive
  when the Suspense key changes during sort/filter navigations
- **TableDataProvider** sits inside Suspense — row data is re-created on
  each navigation via the resolved promise
- **TableWrapperContext** is innermost — needs the rendered wrapper `<div>` ref

## Store Overview

```mermaid
graph LR
  subgraph TableConfigProvider
    CS["columnsStore"]
    MS["metaStore"]
  end

  subgraph FiltersDataProvider
    FS["filtersDataStore"]
  end

  subgraph TableDataProvider
    DS["dataStore"]
  end

  subgraph TableWrapperContext
    WR["wrapperRef (RefObject)"]
  end
```

## Context → Store Summary

| Context        | Store(s)                     | State Pattern                            | Hook Count               |
| -------------- | ---------------------------- | ---------------------------------------- | ------------------------ |
| `TableConfig`  | `columnsStore` + `metaStore` | Dual `TStore` + `useSyncExternalStore`   | 10 + 12 col, 3 + 11 meta |
| `FiltersData`  | `filtersDataStore`           | Single `TStore` + `useSyncExternalStore` | 2 actions, 1 selector    |
| `TableData`    | `dataStore`                  | Single `TStore` + `useSyncExternalStore` | 1 action, 4 selectors    |
| `TableWrapper` | — (ref only)                 | `RefObject<HTMLDivElement>`              | 1 hook                   |

## Cross-Context Data Flow

```mermaid
graph TD
  subgraph "Configuration Layer"
    CS["columnsStore<br/>(columns, filters, sorting, pinning, sizing, visibility)"]
    MS["metaStore<br/>(density, title, drawer toggles, row height)"]
  end

  subgraph "Filter Lookup Layer"
    FS["filtersDataStore<br/>(per-column dropdown options)"]
  end

  subgraph "Data Layer"
    DS["dataStore<br/>(rows, loading, pagination)"]
  end

  subgraph "DOM Layer"
    WR["wrapperRef<br/>(scroll container)"]
  end

  CS -->|"effectiveColumns drive"| DS
  CS -->|"column defs init"| FS
  DS -->|"infinite scroll reads"| WR
  MS -->|"drawer toggles open"| DrawerContexts["TableDrawerContext<br/>ColumnDrawerContext"]
  CS -->|"init + reset"| DrawerContexts
  DrawerContexts -->|"accept pushes back"| CS
```

## Detailed Architecture

| Context      | Details                                         |
| ------------ | ----------------------------------------------- |
| FiltersData  | [ARCHITECTURE.md](FiltersData/ARCHITECTURE.md)  |
| TableConfig  | [ARCHITECTURE.md](TableConfig/ARCHITECTURE.md)  |
| TableData    | [ARCHITECTURE.md](TableData/ARCHITECTURE.md)    |
| TableWrapper | [ARCHITECTURE.md](TableWrapper/ARCHITECTURE.md) |
