import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useSetGrouping } from './useSetGrouping.hook';

export const useResetColumnAggregates = () => {
  const { groupingStore } = useTableConfigContextValue();
  const setGrouping = useSetGrouping();

  return () => {
    const { aggregates, shares } = groupingStore.get();

    setGrouping((grouping) => ({
      aggregates,
      keys: grouping.keys,
      mode: grouping.mode,
      periods: grouping.periods,
      shares,
      totalsPlacement: grouping.totalsPlacement,
      ...(grouping.columnAxis !== undefined && {
        columnAxis: grouping.columnAxis,
      }),
    }));
  };
};
