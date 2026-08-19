import { useSetTableGrouping } from './useSetTableGrouping.hook';

/**
 * Switch grouping off entirely — every key and every selected aggregate.
 *
 * A whole-table action taking no column, which is what stops it being gated on
 * one: clearing asks nothing about any column.
 */
export const useClearTableGrouping = () => {
  const setGrouping = useSetTableGrouping();

  return () => {
    setGrouping(() => ({
      aggregates: {},
      keys: [],
      mode: 'flat',
      periods: {},
    }));
  };
};
