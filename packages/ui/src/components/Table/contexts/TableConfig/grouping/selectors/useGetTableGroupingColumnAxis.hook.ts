import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

export const useGetTableGroupingColumnAxis = () =>
  useGroupingStore((state) => state.columnAxis);
