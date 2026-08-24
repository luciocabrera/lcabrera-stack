import { useGroupingStore } from '../useGroupingStore.hook';

export const useGetGroupingAggregates = () =>
  useGroupingStore((state) => state.aggregates);
