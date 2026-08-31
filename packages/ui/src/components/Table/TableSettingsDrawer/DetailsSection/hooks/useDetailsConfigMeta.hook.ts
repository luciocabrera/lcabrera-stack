import {
  useGetTableDensity,
  useGetTableEnablePrefetch,
  useGetTableInitialPageSize,
  useGetTableIsBordered,
  useGetTableIsStriped,
  useGetTableLoadMorePageSize,
  useGetTableOverscan,
  useGetTablePersistenceKey,
  useGetTableRowHeight,
  useGetTableThreshold,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';

export const useDetailsConfigMeta = () => {
  return {
    density: useGetTableDensity(),
    enablePrefetch: useGetTableEnablePrefetch(),
    initialPageSize: useGetTableInitialPageSize(),
    isBordered: useGetTableIsBordered(),
    isStriped: useGetTableIsStriped(),
    loadMorePageSize: useGetTableLoadMorePageSize(),
    overscan: useGetTableOverscan(),
    persistenceKey: useGetTablePersistenceKey(),
    rowHeight: useGetTableRowHeight(),
    threshold: useGetTableThreshold(),
  };
};
