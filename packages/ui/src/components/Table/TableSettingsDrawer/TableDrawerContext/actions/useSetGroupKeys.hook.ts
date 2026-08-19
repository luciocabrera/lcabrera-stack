import { pruneGroupPeriods } from '#ui/components/Table/contexts/TableConfig/grouping/utils';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage a whole ordered key list — the shape reorder and remove both take,
 * because the order is the grouped query's nesting order and a partial edit
 * could not express a move.
 *
 * The granularities are pruned to the surviving keys rather than carried
 * across. One naming a key that is no longer there is not inert: the server
 * refuses a granularity whose column is not a group key, so a removed date
 * column would take the whole grouped read down with it (#786).
 */
export const useSetGroupKeys = () => {
  const setGrouping = useSetGrouping();

  return (keys: readonly string[]) => {
    setGrouping((grouping) => ({
      aggregates: grouping.aggregates,
      keys,
      mode: grouping.mode,
      periods: pruneGroupPeriods({ keys, periods: grouping.periods }),
    }));
  };
};
