import { useTableDensityStore } from '#ui/components/Table/contexts/TableConfig/meta/useTableDensityStore.hook';

export const useGetTableDensity = () =>
  useTableDensityStore((resolved) => resolved.density);
