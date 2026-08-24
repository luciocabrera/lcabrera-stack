import { useGroupingStore } from '../useGroupingStore.hook';

export const useGetGroupingShares = () =>
  useGroupingStore((state) => state.shares);
