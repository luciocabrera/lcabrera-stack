import { useGroupingStore } from '../useGroupingStore.hook';

/** The aggregates the staged configuration shows as a share of the total. */
export const useGetGroupingShares = () =>
  useGroupingStore((state) => state.shares);
