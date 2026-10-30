import { useTableDensityStore } from '#ui/components/Table/contexts/TableConfig/meta/useTableDensityStore.hook';

export const useGetTableRowHeight = () =>
  useTableDensityStore((resolved) => resolved.rowHeight);
