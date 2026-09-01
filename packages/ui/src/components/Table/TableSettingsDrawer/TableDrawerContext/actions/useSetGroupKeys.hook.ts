import {
  pruneGroupPeriods,
  resolveNewGroupingMode,
} from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { useGetTablePreferredGroupingMode } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetGrouping } from './useSetGrouping.hook';

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
      shares: grouping.shares,
    }));
  };
};
