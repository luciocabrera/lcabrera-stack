import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

export const useGetTableGroupingAggregates = () =>
  useGroupingStore((state) => state.aggregates);
