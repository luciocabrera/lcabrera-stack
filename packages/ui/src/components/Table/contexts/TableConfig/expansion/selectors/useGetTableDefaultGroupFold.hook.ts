import { useExpansionStore } from '#ui/components/Table/contexts/TableConfig/expansion/useExpansionStore.hook';

export const useGetTableDefaultGroupFold = () =>
  useExpansionStore((state) => state.defaultFold);
