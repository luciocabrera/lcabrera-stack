import { useGroupingStore } from '../useGroupingStore.hook';

/** The aggregates staged in the drawer, keyed by column. */
export const useGetGroupingAggregates = () =>
  useGroupingStore((state) => state.aggregates);
