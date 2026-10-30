import { useTableDensityStore } from '#ui/components/Table/contexts/TableConfig/meta/useTableDensityStore.hook';

export const useGetTableHeaderRowHeight = () =>
  useTableDensityStore((resolved) => resolved.headerRowHeight);
