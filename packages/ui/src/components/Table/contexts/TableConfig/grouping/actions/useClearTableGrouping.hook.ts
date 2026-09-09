import { useSetTableGrouping } from './useSetTableGrouping.hook';

export const useClearTableGrouping = () => {
  const setGrouping = useSetTableGrouping();

  return () => {
    setGrouping((current) => ({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: current.totalsPlacement,
    }));
  };
};
