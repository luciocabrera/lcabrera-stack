import { useExpansionStore } from '#ui/components/Table/contexts/TableConfig/expansion/useExpansionStore.hook';

export const useGetTableDrilledGroups = () =>
  useExpansionStore((state) => state.drilledGroups);
