# TableSettingsDrawer Architecture

## File Structure

```
TableSettingsDrawer/
├── index.ts                              → Barrel export: TableSettingsDrawer
├── TableSettingsDrawer.component.tsx      → Root: SidePanel composing header/body/footer
│
├── TableSettingsDrawerHeader/            → Title + pin/close toolbar
│   ├── TableSettingsDrawerHeader.component.tsx
│   ├── TableSettingsDrawerHeader.types.ts
│   └── TableSettingsDrawerHeader.test.tsx
│
├── TableSettingsDrawerBody/              → Tabbed sections container
│   ├── TableSettingsDrawerBody.component.tsx
│   ├── TableSettingsDrawerBody.types.ts
│   └── TableSettingsDrawerBody.test.tsx
│
├── TableSettingsDrawerFooter/            → Accept/Cancel buttons
│   ├── TableSettingsDrawerFooter.component.tsx
│   ├── TableSettingsDrawerFooter.types.ts
│   └── TableSettingsDrawerFooter.test.tsx
│
├── hooks/                                → Handlers shared across the drawer shell
│   ├── useCancelTableSettings.hook.ts     → Reset drawer state + close if unpinned (busy-guarded)
│   └── useCloseTableSettingsIfUnpinned.hook.ts → Close drawer unless pinned
│
├── TableDrawerContext/                   → Store-based context for drawer state
│   ├── TableDrawerContext.context.ts      → createContext
│   ├── TableDrawerContext.provider.tsx     → Provider: seeds both drafts from table state
│   ├── TableDrawerContext.types.ts        → TableDrawerColumnsState, ContextValue
│   ├── useTableDrawerContextValue.hook.ts → use(TableDrawerContext)
│   ├── useColumnsStore.hook.ts            → useSyncExternalStore + selector
│   ├── useGroupingStore.hook.ts           → useSyncExternalStore + selector (grouping draft)
│   │
│   ├── actions/                           → Action hooks (set/clear/reset/batch/stage)
│   │   ├── useBatchSetTableDrawerSettings → Push both drafts to the table in one commit
│   │   ├── useClearAllSettings            → Clear all column fields
│   │   ├── useClearColumnOrderSection     → Clear visibility + pinning
│   │   ├── useClearFilters                → Clear all filters
│   │   ├── useClearGrouping               → Stage grouping switched off
│   │   ├── useClearSorting                → Clear all sorting
│   │   ├── useOrderColumnsBySorting       → Reorder columns by sorting
│   │   ├── useResetColumnOrderAndVisibility → Reset order + visibility from table
│   │   ├── useResetFilters                → Reset filters from table
│   │   ├── useResetSorting                → Reset sorting from table
│   │   ├── useResetTableSettings          → Re-seed both drafts from the table
│   │   ├── useSetColumnAggregate          → Stage / clear one column's aggregate
│   │   ├── useSetColumnFilters            → Set filters object
│   │   ├── useSetColumnPinning            → Set pinning state + sync draft order
│   │   ├── useSetColumnsOrder             → Set column order array
│   │   ├── useSetColumnsSizing            → Set column widths
│   │   ├── useSetColumnsSortings          → Set sorting array
│   │   ├── useSetColumnsVisibility        → Set visibility set
│   │   ├── useSetGrouping                 → Internal: the draft's grouping write path
│   │   ├── useSetGroupKeys                → Stage the whole ordered key list
│   │   ├── useSortByColumnOrder           → Create sorts from column order
│   │   └── useToggleGroupKey              → Stage adding / removing one key
│   │
│   └── selectors/                         → Selector hooks (read drawer state)
│       ├── useGetColumnFilters
│       ├── useGetColumnOrder
│       ├── useGetColumnPinning
│       ├── useGetColumnsSorting
│       ├── useGetColumnVisibility
│       ├── useGetGroupingAggregates
│       └── useGetGroupingKeys
│
├── GeneralSettingsSection/                → Width presets + cross-section toolbars
│   ├── GeneralSettingsSection.component.tsx → Thin composition
│   ├── GeneralSettingsSection.types.ts
│   ├── ColumnWidthsSection/               → Width preset toggles (owns preset state)
│   ├── AllSettingsSection/                → Clear/reset-all buttons
│   ├── utils/                             → buildPresetColumnSizing
│   └── index.ts
│
├── DetailsSection/                        → Read-only table metadata and metrics
│   ├── DetailsSection.component.tsx
│   ├── DetailsSection.types.ts
│   ├── DetailsSection.stylex.ts
│   └── index.ts
│
├── FiltersSection/                        → Multi-filter add/remove/expand/validate
│   ├── FiltersSection.component.tsx        → Orchestrator
│   ├── index.ts
│   ├── FiltersSection/utils/isFilterValid.util.ts
│   ├── AddFilterSection/                  → VirtualSelect for adding filters
│   ├── ActiveFiltersList/                 → Expandable filter items with FilterInputs
│   └── FiltersSectionToolbar/             → Expand/collapse/clear/reset filter (toolbar + footer)
│
├── SortingSection/                        → Multi-sort add/remove/reorder
│   ├── SortingSection.component.tsx        → Orchestrator
│   ├── SortingSection.types.ts
│   ├── index.ts
│   ├── AddSortSection/                    → VirtualSelect for adding sorts
│   ├── ActiveSortList/                    → DraggableList of sorts
│   ├── SortingSectionToolbar/             → Sort/clear/reset (toolbar + footer)
│   └── utils/
│
├── GroupingSection/                       → Multi-key grouping + aggregate selection
│   ├── GroupingSection.component.tsx       → Orchestrator
│   ├── GroupingSection.test.tsx            → Staging + navigation-count integration test
│   ├── GroupingSection.types.ts
│   ├── index.ts
│   ├── AddGroupKeySection/                → VirtualSelect for adding a group key
│   ├── ActiveGroupKeyList/                → DraggableList of applied keys
│   ├── AddAggregateSection/               → Column → legal-function selects
│   ├── ActiveAggregateList/               → Selected aggregates, each removable
│   ├── GroupingSectionToolbar/            → Clear grouping (toolbar + footer)
│   └── utils/
│
└── ColumnOrderSection/                    → Drag-drop column order + pin + visibility
    ├── ColumnOrderSection.component.tsx    → DraggableList + conflict modals
    ├── ColumnOrderSection.types.ts         → Conflict resolution types
    ├── index.ts
    ├── ColumnOrderSectionContext/          → Nested context for modal state
    ├── ColumnOrderSectionToolbar/          → Order/clear/reset (toolbar + footer)
    ├── OrderConflictModal/                → Order/pin conflict resolution radio
    ├── PinConflictModal/                  → Pin contiguity conflict resolution
    ├── UnpinConflictModal/                → Unpin gap conflict resolution
    └── utils/                             → 9 pin/order conflict utilities
```

## Dependencies

```mermaid
graph LR
  TSD["TableSettingsDrawer"] --> SidePanel
  TSD --> TSDHeader["TableSettingsDrawerHeader"]
  TSD --> TSDBody["TableSettingsDrawerBody"]
  TSD --> TSDFooter["TableSettingsDrawerFooter"]
  TSD --> CancelHook["useCancelTableSettings"]

  TSDHeader --> SidePanelHeader
  TSDHeader --> SidePanelHeaderToolbar
  TSDHeader --> SidePanelTitle
  TSDHeader --> SettingsIcon
  TSDHeader --> CancelHook
  TSDHeader --> TableConfigContext

  TSDBody --> SidePanelBody
  TSDBody --> Tabs
  TSDBody --> TableConfigContext

  TSDFooter --> SidePanelFooter
  TSDFooter --> ActionButtons
  TSDFooter --> CancelHook
  TSDFooter --> CloseHook["useCloseTableSettingsIfUnpinned"]
  TSDFooter --> TableDrawerContext

  CancelHook --> CloseHook
  CancelHook --> TableDrawerContext
  CloseHook --> TableConfigContext

  TableDrawerContext --> useStore["useStore (custom hook)"]
  TableDrawerContext --> TableConfigContext

  GeneralSettingsSection --> TableDrawerContext
  GeneralSettingsSection --> TableConfigContext
  GeneralSettingsSection --> FiltersSectionToolbar
  GeneralSettingsSection --> SortingSectionToolbar
  GeneralSettingsSection --> ColumnOrderSectionToolbar

  DetailsSection --> TableConfigContext
  DetailsSection --> TableDataContext

  FiltersSection --> TableDrawerContext
  FiltersSection --> TableConfigContext
  FiltersSection --> FilterInputs["Table/filters/FilterInputs"]
  FiltersSection --> VirtualSelect

  SortingSection --> TableDrawerContext
  SortingSection --> TableConfigContext
  SortingSection --> DraggableList
  SortingSection --> VirtualSelect2["VirtualSelect"]

  ColumnOrderSection --> TableDrawerContext
  ColumnOrderSection --> TableConfigContext
  ColumnOrderSection --> ColumnOrderSectionContext
  ColumnOrderSection --> DraggableList2["DraggableList"]
  ColumnOrderSection --> PinSideModal["PinSideModal (shared)"]
```

## Render Flow

```mermaid
graph TD
  A["TableSettingsDrawer renders SidePanel"] --> O["TableSettingsDrawerHeader: Settings icon + title + pin/close toolbar"]
  A --> P["TableSettingsDrawerBody: Tabs component"]
  A --> Q["TableSettingsDrawerFooter: Accept + Cancel buttons"]

  O --> W{"Toggle pin?"}
  W -->|Yes| X["set isTableSettingsPinned"]
  O --> C2{"Toolbar close?"}
  C2 -->|Yes| V

  P --> D["Build tabs array"]

  D --> E["Tab: General"]
  E --> F["GeneralSettingsSection"]

  D --> E2["Tab: Details"]
  E2 --> F2["DetailsSection"]

  D --> G["Tab: Filters"]
  G --> H["FiltersSection"]

  D --> I["Tab: Sorting"]
  I --> J["SortingSection"]

  D --> I2["Tab: Grouping (only when isGroupingEnabled)"]
  I2 --> J2["GroupingSection"]

  D --> K["Tab: Columns"]
  K --> L["ColumnOrderSectionProvider"]
  L --> M["ColumnOrderSection"]

  Q --> R{"Accept?"}
  R -->|Yes + invalid filters| S["notify('Invalid filters') + keep drawer open"]
  R -->|Yes + valid filters| T["batchSetTableDrawerSettings()"]
  T --> U{"Pinned?"}
  U -->|Yes| K1["Keep drawer open"]
  U -->|No| K2["set isTableSettingsOpen=false"]
  Q --> C{"Cancel?"}
  C -->|Yes| V["useCancelTableSettings: resetTableSettings()"]
  A --> C3{"Panel close?"}
  C3 -->|Yes| V
  V --> P2{"Pinned?"}
  P2 -->|Yes| K3["Keep drawer open"]
  P2 -->|No| K4["set isTableSettingsOpen=false"]
```

## State Management: TableDrawerContext

Store-based context pattern using `useStore` + `useSyncExternalStore` with
17 action hooks and 5 selector hooks.

See [TableDrawerContext/ARCHITECTURE.md](TableDrawerContext/ARCHITECTURE.md) for full details.

**Key flows**:

- **Accept**: `useBatchSetTableDrawerSettings` reads both drawer drafts — column
  state and grouping — and pushes them to `TableConfigContext` through one
  `useBatchSetTableSettings` call, which issues exactly one persistence write and
  therefore one navigation
- **Invalid accept**: `notify(...)` sends a warning through the app-level `NotificationProvider`; the viewport is rendered once at the root, not inside the drawer
- **Pin state**: `isTableSettingsPinned` is owned by `TableConfig.metaStore`, not local component state
- **Expanded filter children state**: `tableSettingsExpandedFilters` is owned by `TableConfig.metaStore` and restored by `FiltersSection`
- **Selected tab state**: `tableSettingsSelectedTab` is owned by `TableConfig.metaStore` and wired through controlled `Tabs`
- **Cancel**: `hooks/useCancelTableSettings` (shared by the panel close, the
  header toolbar close, and the footer Cancel button) calls
  `useResetTableSettings()` to read current table state back into the drawer
  store, then `hooks/useCloseTableSettingsIfUnpinned` closes only when
  unpinned; the whole flow no-ops while busy. It re-seeds the grouping draft
  too, so discarding a grouping edit costs no navigation and no loader run

## Tab Sections

All sections follow a consistent pattern: they use SidePanel sub-components for layout,
read/write state through TableDrawerContext actions and selectors, and each features
a toolbar in dual-variant mode.

| Section                  | Tab      | Features                                                                                                                                                                                                                                                                                                                         | Details                                                   |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `GeneralSettingsSection` | General  | Width presets, cross-section clear/reset, all settings clear/reset                                                                                                                                                                                                                                                               | [ARCHITECTURE.md](GeneralSettingsSection/ARCHITECTURE.md) |
| `DetailsSection`         | Details  | Required row counts, optional table/schema, technical metadata                                                                                                                                                                                                                                                                   | [ARCHITECTURE.md](DetailsSection/ARCHITECTURE.md)         |
| `FiltersSection`         | Filters  | Add/remove/expand filters, FilterInputs, validation                                                                                                                                                                                                                                                                              | [ARCHITECTURE.md](FiltersSection/ARCHITECTURE.md)         |
| `SortingSection`         | Sorting  | Add/remove/reorder sorts, direction toggle                                                                                                                                                                                                                                                                                       | [ARCHITECTURE.md](SortingSection/ARCHITECTURE.md)         |
| `GroupingSection`        | Grouping | Multi-key group add/remove/reorder, legality-derived aggregate selection. Tab present only where the route declared `isGroupingEnabled`. Staged like every other section; what differs is the commit — grouping is URL state (ADR-061), so it rides in the same single Accept write as the column state rather than a second one | [ARCHITECTURE.md](GroupingSection/ARCHITECTURE.md)        |
| `ColumnOrderSection`     | Columns  | Drag-drop reorder, pin toggle, visibility toggle, conflict modals                                                                                                                                                                                                                                                                | [ARCHITECTURE.md](ColumnOrderSection/ARCHITECTURE.md)     |

### Section Toolbar Pattern

Filters, Sorting, Grouping, and ColumnOrder sections each have a `*SectionToolbar` sub-component
that renders in two variants controlled by a `variant` prop:

| Variant     | Placement              | Button Style            | Shows Labels?  |
| ----------- | ---------------------- | ----------------------- | -------------- |
| `'toolbar'` | SidePanelSectionHeader | `ghost`, `mini`, `auto` | No (icon only) |
| `'footer'`  | Below the section      | `outline`, `sm`, `full` | Yes            |

Each toolbar provides section-specific actions (clear, reset, and special operations).
GeneralSettingsSection reuses all three toolbars in their `'footer'` variant.

## Nested Context Architecture

```mermaid
graph TD
  subgraph "TableConfigContext (external)"
    TCC["columnsStore + metaStore"]
  end

  subgraph "TableDrawerContext"
    TDC["columnsStore + groupingStore (drawer-local copies)"]
  end

  subgraph "ColumnOrderSectionContext"
    COSC["modalsStore (pin/order conflict state)"]
  end

  TCC -->|"init + reset"| TDC
  TDC -->|"accept"| TCC
  TDC -->|"read/write"| COSC
```

Three context layers:

1. **TableConfigContext** (external) — source of truth for the table
2. **TableDrawerContext** — local working copies of column state and grouping
3. **ColumnOrderSectionContext** — modal state for pin/order conflict resolution

## Consumers

Used in `TableDrawersSection` which wraps it with `TableDrawerProvider`:

```
<TableDrawerProvider>
  <TableSettingsDrawer
    isBusy={isLoadingMore || (isLoading && isTableSettingsPinned)}
  />
</TableDrawerProvider>
```

When load-more is in progress, or when the persisted drawer state is pinned+open
during initial loading, `TableDrawersSection` still renders this component and passes
`isBusy=true`. Controls remain visible but become non-interactive and
render shimmer overlays to preserve layout and avoid loading shifts.
