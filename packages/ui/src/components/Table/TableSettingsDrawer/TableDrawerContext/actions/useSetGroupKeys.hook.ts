import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage a whole ordered key list — the shape reorder and remove both take,
 * because the order is the grouped query's nesting order and a partial edit
 * could not express a move.
 */
export const useSetGroupKeys = () => {
  const setGrouping = useSetGrouping();

  return (keys: readonly string[]) => {
    setGrouping((grouping) => ({ aggregates: grouping.aggregates, keys }));
  };
};
