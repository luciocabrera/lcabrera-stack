import { useSetGrouping } from './useSetGrouping.hook';

export const useClearColumnAggregates = () => {
  const setGrouping = useSetGrouping();

  return () => {
    setGrouping((grouping) => ({
      aggregates: [],
      keys: grouping.keys,
      mode: grouping.mode,
      periods: grouping.periods,
      shares: [],
      totalsPlacement: grouping.totalsPlacement,
    }));
  };
};
