import { useGroupingStore } from '../useGroupingStore.hook';

/** The columns whose measure the staged configuration shows as a share. */
export const useGetGroupingShares = () =>
  useGroupingStore((state) => state.shares);
