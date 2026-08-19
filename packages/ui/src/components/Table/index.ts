// Main Table component
export { Table } from './Table.component';

// Only the types consumers actually reach for through this barrel. Everything
// else in Table.types.ts stays exported from that module and is imported
// directly — ADR-007: a barrel is a controlled public API, not a mirror of the
// types file. Re-exports with no importer are dead weight that fallow reports
// as unused-types, so add one here only when an external consumer needs it.
export type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableColumnsStateInput,
  TableGroupDrillFetcher,
  TableGroupDrillRequest,
  TableMetaState,
  TableProps,
} from './Table.types';
