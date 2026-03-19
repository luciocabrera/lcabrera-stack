# TableDrawersSection Architecture

Conditional renderer for table-level and column-level settings drawers.
Reads meta state to decide which drawer to show, and wraps each in its
own context provider.

## File Structure

```
TableDrawersSection/
├── TableDrawersSection.component.tsx   → Conditional drawer rendering
└── index.ts                            → Barrel export
```

## Render Logic

```mermaid
graph TD
  TDS["TableDrawersSection"] --> isTable["useGetTableIsTableSettingsOpen()"]
  TDS --> isCol["useGetTableIsColumnSettingsOpen()"]
  TDS --> colKey["useGetTableColumnSelectedKey()"]

  isTable -->|true| TDP["TableDrawerProvider"]
  TDP --> TSD["TableSettingsDrawer"]

  isCol -->|"true + columnKey"| CDP["ColumnDrawerProvider"]
  CDP --> CSD["ColumnSettingsDrawer"]

  isTable -->|false| check2{"isColumnSettingsOpen && columnKey?"}
  check2 -->|false| empty["<> (empty fragment)"]
```

## Context Providers

Each drawer gets its own provider so the drawer-local store is only
created when the drawer is open:

- **TableDrawerProvider** → wraps `TableSettingsDrawer`
- **ColumnDrawerProvider** → wraps `ColumnSettingsDrawer` with `columnKey`
