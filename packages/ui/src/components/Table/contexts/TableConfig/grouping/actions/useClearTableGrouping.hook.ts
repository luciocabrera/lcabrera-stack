import { useSetTableGrouping } from './useSetTableGrouping.hook';

export const useClearTableGrouping = () => {
  const setGrouping = useSetTableGrouping();

  return () => {
    setGrouping(() => ({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    }));
  };
};
