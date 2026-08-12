import { useSetTableGrouping } from './useSetTableGrouping.hook';

/**
 * Replace the whole ordered key list — the drawer's affordance, where a user
 * can see every applied key at once and so can reorder or remove any of them.
 *
 * The order matters and is not incidental: it is the grouped query's nesting
 * order, so moving a key changes which question the table answers rather than
 * only how it looks.
 */
export const useSetTableGroupKeys = () => {
  const setGrouping = useSetTableGrouping();

  return (keys: readonly string[]) => {
    setGrouping((grouping) => ({ aggregates: grouping.aggregates, keys }));
  };
};
