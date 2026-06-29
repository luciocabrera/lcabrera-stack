# Table Data Flow — Props → Providers → Selectors → Components → Actions

```mermaid
graph TB
    subgraph PROPS["Props (Entry)"]
        dataPromise["dataPromise<br/><small>Promise&lt;TableData&gt;</small>"]
        colDefs["columns: TableColumn[]"]
        config["config: density, borders,<br/>title, persistenceKey"]
    end

    subgraph PROVIDERS["Context Providers (Write)"]
        direction LR
        TCP["TableConfigProvider<br/><small>columnsStore + metaStore</small>"]
        FDP["FiltersDataProvider<br/><small>filtersDataStore</small>"]
        TDP["TableDataProvider<br/><small>dataStore</small>"]
    end

    subgraph SELECTORS["Selectors (Read)"]
        direction TB
        gEC["useGetEffectiveColumns"]
        gNC["useGetNormalizedColumns"]
        gCS["useGetColumnsSorting"]
        gCF["useGetColumnFilters"]
        gCV["useGetColumnVisibility"]
        gCSz["useGetColumnSizing"]
    end

    subgraph ACTIONS["Actions (Mutate)"]
        direction TB
        setSorting["useSetColumnSorting"]
        setFilter["useSetColumnFilter<br/><small>(ColumnDrawer)</small>"]
        setSizing["useSetColumnSizing"]
        batchSet["useBatchSetColumnSettings<br/>useBatchSetTableSettings"]
        persist["usePersistTableStateAction<br/><small>Cookie + URL sync</small>"]
    end

    subgraph COMPONENTS["Components (Render)"]
        direction TB
        THC2["TableHeaderCell<br/><small>sort click · filter icon · resize drag</small>"]
        TBC2["TableBodyCell<br/><small>renderCellContent</small>"]
        TBody2["TableBody<br/><small>useVirtualization</small>"]
        FI["FilterInputs<br/><small>dispatches to typed input</small>"]
    end

    subgraph HOOKS["Specialized Hooks"]
        direction TB
        colResize["useColumnResize<br/><small>RAF-throttled drag</small>"]
        infScroll["useInfiniteScroll<br/><small>sentinel intersect → fetchMore</small>"]
        virtHook["useVirtualization<br/><small>visible row calc</small>"]
    end

    %% Data flow
    dataPromise --> TDP
    colDefs --> TCP
    config --> TCP

    TCP --> SELECTORS
    FDP --> FI
    TDP --> TBody2

    SELECTORS --> COMPONENTS
    COMPONENTS -->|"user interaction"| ACTIONS
    ACTIONS -->|"store.set()"| TCP
    ACTIONS --> persist -->|"cookie / URL"| EXT["External Storage"]

    THC2 --> colResize --> setSizing
    TBody2 --> virtHook
    TBody2 --> infScroll -->|"fetchMoreData"| TDP

    classDef props fill:#e3f2fd,stroke:#1565c0
    classDef provider fill:#e8f5e9,stroke:#2e7d32
    classDef selector fill:#fff9c4,stroke:#f9a825
    classDef action fill:#fce4ec,stroke:#c62828
    classDef comp fill:#f3e5f5,stroke:#7b1fa2
    classDef hook fill:#fff3e0,stroke:#ef6c00

    class dataPromise,colDefs,config props
    class TCP,FDP,TDP provider
    class gEC,gNC,gCS,gCF,gCV,gCSz selector
    class setSorting,setFilter,setSizing,batchSet,persist action
    class THC2,TBC2,TBody2,FI comp
    class colResize,infScroll,virtHook hook
```

## Legend

- 🔵 **Blue** — Props (entry data)
- 🟢 **Green** — Context Providers (write layer)
- 🟡 **Yellow** — Selectors (read layer)
- 🔴 **Red** — Actions (mutation layer)
- 🟣 **Purple** — Components (render layer)
- 🟠 **Orange** — Specialized Hooks
