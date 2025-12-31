// Hooks
export {
  useInfiniteScroll,
  useSkeletonRowCount,
  useTablePersistence,
} from './hooks';
// Skeleton components

// Main Table component
export { Table } from './Table.component';
export type {
  TableColumn,
  TableColumnDataType,
  TableProps,
} from './Table.types';

// Context
export { TableContext, TableProvider } from './TableContext';

export type {
  ColumnFiltersState,
  ColumnPinningState,
  LoadMoreHandler,
  PaginationState,
  RowSelectionState,
  SortDirection,
  SortingState,
  TableContextValue,
  TableMeta,
  TablePersistenceConfig,
  TableProviderProps,
  TableState,
} from './TableContext';

// Context Hooks - Selectors
export {
  useColumnFilters,
  useColumnPinning,
  useHasMore,
  useMetaStore,
  usePagination,
  useRowSelection,
  useSorting,
  useTableData,
  useTableError,
  useTableLoading,
  useTableLoadingMore,
  useTableStore,
  useTotalRows,
} from './TableContext';
// Context Hooks - Actions
export {
  useAppendTableData,
  useSelectAllRows,
  useSelectRow,
  useSetColumnFilters,
  useSetError,
  useSetLoading,
  useSetLoadingMore,
  useSetPagination,
  useSetSorting,
  useSetTableData,
} from './TableContext';

// Suspense
export { TableSuspenseBoundary } from './TableSuspenseBoundary';
export type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary';
