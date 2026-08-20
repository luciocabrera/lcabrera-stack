import { useGroupingStore } from '../useGroupingStore.hook';

/** The aggregates staged in the drawer, in order. */
export const useGetGroupingAggregates = () =>
  useGroupingStore((state) => state.aggregates);
