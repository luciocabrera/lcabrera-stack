import { useGroupingStore } from '../useGroupingStore.hook';

/** The granularity each staged temporal key would be truncated to, by column. */
export const useGetGroupingPeriods = () =>
  useGroupingStore((state) => state.periods);
