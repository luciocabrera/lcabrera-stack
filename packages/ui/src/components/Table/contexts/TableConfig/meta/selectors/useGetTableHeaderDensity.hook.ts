import { useTableDensityStore } from '#ui/components/Table/contexts/TableConfig/meta/useTableDensityStore.hook';

export const useGetTableHeaderDensity = () =>
  useTableDensityStore((resolved) => resolved.headerDensity);
