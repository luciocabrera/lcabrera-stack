import {
  pruneGroupPeriods,
  resolveNewGroupingMode,
} from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { useGetTablePreferredGroupingMode } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * One naming a key that is no longer there is not inert: the server refuses a granularity
 * whose column is not a group key, so a removed date column would take the whole grouped
 * read down with it (#786).
 */
export const useSetGroupKeys = () => {
  const setGrouping = useSetGrouping();
  const preferredMode = useGetTablePreferredGroupingMode();

  return (keys: readonly string[]) => {
    setGrouping((grouping) => ({
      aggregates: grouping.aggregates,
      keys,
      mode: resolveNewGroupingMode({
        keys,
        preferredMode,
        previousKeys: grouping.keys,
        previousMode: grouping.mode,
      }),
      periods: pruneGroupPeriods({ keys, periods: grouping.periods }),
      // Carried, not pruned: a share belongs to an aggregate, and removing a
      // group key removes no aggregate.
      shares: grouping.shares,
    }));
  };
};
