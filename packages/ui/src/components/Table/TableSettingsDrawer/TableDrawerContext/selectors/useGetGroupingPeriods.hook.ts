import { useGroupingStore } from '../useGroupingStore.hook';

export const useGetGroupingPeriods = () =>
  useGroupingStore((state) => state.periods);
