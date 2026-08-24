import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

export const useGetTableGroupingPeriods = () =>
  useGroupingStore((state) => state.periods);
