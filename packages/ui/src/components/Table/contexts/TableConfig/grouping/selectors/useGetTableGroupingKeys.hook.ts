import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

export const useGetTableGroupingKeys = () =>
  useGroupingStore((state) => state.keys);
