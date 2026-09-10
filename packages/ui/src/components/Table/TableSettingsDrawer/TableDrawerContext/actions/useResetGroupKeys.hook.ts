import { pruneColumnAxis } from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useSetGrouping } from './useSetGrouping.hook';

export const useResetGroupKeys = () => {
  const { groupingStore } = useTableConfigContextValue();
  const setGrouping = useSetGrouping();

  return () => {
    const { keys, mode, periods } = groupingStore.get();

    setGrouping((grouping) => {
      const nextColumnAxis = pruneColumnAxis({
        columnAxis: grouping.columnAxis,
        keys,
      });

      return {
        aggregates: grouping.aggregates,
        keys,
        mode: grouping.keys.length === 0 ? mode : grouping.mode,
        periods,
        shares: grouping.shares,
        totalsPlacement: grouping.totalsPlacement,
        ...(nextColumnAxis !== undefined && { columnAxis: nextColumnAxis }),
      };
    });
  };
};
