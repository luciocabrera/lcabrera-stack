import { useSetTableGrouping } from './useSetTableGrouping.hook';

/** Switch grouping off entirely — every key and every selected aggregate. */
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
