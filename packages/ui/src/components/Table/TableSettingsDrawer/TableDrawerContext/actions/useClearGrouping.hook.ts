import { useSetGrouping } from './useSetGrouping.hook';

export const useClearGrouping = () => {
  const setGrouping = useSetGrouping();

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
