# Drawer Architecture — Column Settings + Table Settings + Filter Types

```mermaid
graph TB
    subgraph ColumnSettingsDrawer["ColumnSettingsDrawer (per-column)"]
        direction TB
        CDP2["ColumnDrawerProvider<br/><small>Snapshots column state on open</small>"]

        subgraph ColTabs["Tabs"]
            direction LR
            GS["GeneralSection<br/><small>Width presets<br/>min / max / default<br/>Clear · Reset</small>"]
            DS["DetailsSection<br/><small>Read-only info<br/>key · dataType<br/>sortable · filterable</small>"]
            FS["FilterSection<br/><small>Filter config<br/>operator + value<br/>Clear · Reset</small>"]
            SS["SortingSection<br/><small>asc / desc / clear<br/>per column</small>"]
        end

        CDP2 --> ColTabs
    end

    subgraph TableSettingsDrawer["TableSettingsDrawer (global)"]
        direction TB
        TDP3["TableDrawerProvider<br/><small>Snapshots table state on open</small>"]

        subgraph TblTabs["Tabs"]
            direction LR
            GSS["GeneralSettingsSection<br/><small>Density · Borders<br/>Stripes · Title</small>"]
            TSS["SortingSection<br/><small>Multi-column sort<br/>Add · Remove · Reorder</small>"]
            FSS["FiltersSection<br/><small>All active filters<br/>Add · Remove · Edit</small>"]
            COS["ColumnOrderSection<br/><small>Visibility toggles<br/>Drag reorder · Pinning</small>"]
        end

        TDP3 --> TblTabs
    end

    subgraph DrawerLifecycle["Drawer State Lifecycle"]
        direction LR
        OPEN["Open Drawer<br/><small>Snapshot current state<br/>into drawer store</small>"]
        EDIT["Edit in Drawer<br/><small>Modify local<br/>drawer state only</small>"]
        ACCEPT["Accept<br/><small>Batch update<br/>main stores</small>"]
        CANCEL["Cancel<br/><small>Discard changes<br/>restore snapshot</small>"]

        OPEN --> EDIT
        EDIT --> ACCEPT
        EDIT --> CANCEL
    end

    subgraph FilterTypes["Filter Input Types"]
        direction LR
        TFI["TextFilterInput<br/><small>contains · equals<br/>startsWith · endsWith</small>"]
        NFI["NumberFilterInput<br/><small>equals · gt · lt<br/>between</small>"]
        DFI["DateFilterInput<br/><small>equals · before<br/>after · between</small>"]
        BFI["BooleanFilterInput<br/><small>true / false</small>"]
        SFI["SelectFilterInput<br/><small>Lazy-loaded options<br/>multi-select</small>"]
    end

    FS -->|"dispatches via FilterInputs"| FilterTypes

    classDef drawer fill:#e1f5fe,stroke:#0288d1
    classDef tab fill:#f3e5f5,stroke:#7b1fa2
    classDef lifecycle fill:#e8f5e9,stroke:#2e7d32
    classDef filter fill:#fff9c4,stroke:#f9a825

    class CDP2,TDP3 drawer
    class GS,DS,FS,SS,GSS,TSS,FSS,COS tab
    class OPEN,EDIT,ACCEPT,CANCEL lifecycle
    class TFI,NFI,DFI,BFI,SFI filter
```

## Legend

- 🔵 **Blue** — Drawer Providers
- 🟣 **Purple** — Drawer Tabs/Sections
- 🟢 **Green** — Lifecycle States
- 🟡 **Yellow** — Filter Input Types
