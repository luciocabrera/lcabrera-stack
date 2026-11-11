import { useTableDensityStore } from '#ui/components/Table/contexts/TableConfig/meta/useTableDensityStore.hook';

export const useGetTableTitleDensity = () =>
  useTableDensityStore((resolved) => resolved.titleDensity);
