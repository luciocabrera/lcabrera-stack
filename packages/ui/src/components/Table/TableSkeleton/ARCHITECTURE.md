# TableSkeleton Architecture

Loading placeholder that renders a full table while data is being fetched
inside the Suspense boundary. On refresh, it reuses tab-scoped persisted rows
to reduce layout shift; on first load it falls back to generated placeholders.

## File Structure

```
TableSkeleton/
├── TableSkeleton.component.tsx   → Generates placeholder data → renders Table
├── TableSkeleton.types.ts        → SkeletonResponse type
└── index.ts                      → Barrel export
```

## How It Works

```mermaid
graph TD
  SK["TableSkeleton"] --> cols["useGetColumns()"]
  SK --> key["useGetTablePersistenceKey()"]
  SK --> count["useGetTablePlaceholderRowCount()"]
  key --> read["readPersistedDataStateFromSessionStorage()"]
  cols --> gen["generatePlaceholderData(columns, rowCount)"]
  count --> gen
  gen --> data["Array of empty row objects"]
  read --> cached["Persisted rows + totalRows (optional)"]
  cached --> choose{"Has cached rows?"}
  data --> choose
  choose -->|Yes| effective["Use cached rows"]
  choose -->|No| effective["Use placeholder rows"]
  effective --> T["<Table isLoading response={{ data, totalRows }} />"]
```

Reuses the actual `Table` component with `isLoading=true`, which triggers
shimmer overlays in `TableBodyCell` and `TableHeaderCell`.

## Context Dependencies

| Selector                         | Purpose                     |
| -------------------------------- | --------------------------- |
| `useGetColumns`                  | Column definitions for keys |
| `useGetTablePersistenceKey`      | Session storage namespace   |
| `useGetTablePlaceholderRowCount` | Number of skeleton rows     |
