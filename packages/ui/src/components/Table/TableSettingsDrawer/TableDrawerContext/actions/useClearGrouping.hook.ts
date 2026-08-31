import { useSetGrouping } from './useSetGrouping.hook';

export const useClearGrouping = () => {
  const setGrouping = useSetGrouping();

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
