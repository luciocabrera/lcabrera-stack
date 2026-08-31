import { pruneGroupPeriods } from '#ui/components/Table/contexts/TableConfig/grouping/utils';

import { useSetGrouping } from './useSetGrouping.hook';

export const useSetGroupKeys = () => {
  const setGrouping = useSetGrouping();

  return (keys: readonly string[]) => {
    setGrouping((grouping) => ({
      aggregates: grouping.aggregates,
      keys,
      mode: grouping.mode,
      periods: pruneGroupPeriods({ keys, periods: grouping.periods }),
      shares: grouping.shares,
    }));
  };
};
