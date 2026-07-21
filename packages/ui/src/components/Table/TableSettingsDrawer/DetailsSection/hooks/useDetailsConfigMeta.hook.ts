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
} from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors';

/**
 * Read the technical configuration meta values for the details panel.
 * @returns Density, pagination, virtualization, and persistence config values.
 */
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
