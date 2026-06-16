# TableDrawersSection Architecture

Conditional renderer for table-level and column-level settings drawers.
Reads meta state to decide which drawer to show, and wraps each in its
own context provider.

## File Structure

```
TableDrawersSection/
├── TableDrawersSection.component.tsx   → Conditional drawer rendering
├── TableDrawersSection.test.tsx        → Unit tests for drawer selection and provider wiring
└── index.ts                            → Barrel export
```

## Render Logic

```mermaid
graph TD
  TDS["TableDrawersSection"] --> isTable["useGetTableIsTableSettingsOpen()"]
  TDS --> isTablePinned["useGetTableIsTableSettingsPinned()"]
  TDS --> isCol["useGetTableIsColumnSettingsOpen()"]
  TDS --> isColPinned["useGetTableIsColumnSettingsPinned()"]
  TDS --> isLoading["useGetTableIsLoading()"]
  TDS --> isLoadingMore["useGetTableIsLoadingMore()"]
  TDS --> colKey["useGetTableColumnSelectedKey()"]

  isCol -->|"true + columnKey"| CDP["ColumnDrawerProvider"]
  CDP --> CSD["ColumnSettingsDrawer"]
  isLoadingMore --> CBusy{"isLoadingMore || (isColPinned && isLoading)"}
  isLoading --> CBusy
  CBusy -->|Yes| CBusyProp["ColumnSettingsDrawer isBusy=true"]

  isCol -->|false| check2{"isTableSettingsOpen?"}
  check2 -->|true| TDP["TableDrawerProvider"]
  TDP --> TSD["TableSettingsDrawer"]
  isLoadingMore --> TBusy{"isLoadingMore || (isTablePinned && isLoading)"}
  isLoading --> TBusy
  TBusy -->|Yes| TBusyProp["TableSettingsDrawer isBusy=true"]

  check2 -->|false| empty["<> (empty fragment)"]
```

## Precedence Rule

When both drawers are requested at the same time, **column settings wins**.
This allows per-column settings to temporarily override table settings,
including when table settings is pinned.

## Context Providers

Each drawer gets its own provider so the drawer-local store is only
created when the drawer is open:

- **TableDrawerProvider** → wraps `TableSettingsDrawer`
- **ColumnDrawerProvider** → wraps `ColumnSettingsDrawer` with `columnKey`

## Busy Behavior

Busy shimmer is injected in two cases:

- The table is in incremental fetch mode (`isLoadingMore=true`) and the drawer is open
- The table is in initial loading mode and the corresponding drawer is pinned

This keeps pinned drawers stable during full refreshes while also surfacing fetch-more
activity in whichever drawer is currently visible.
