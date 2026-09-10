import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useResetColumnAggregates = () => {
  const { groupingStore } = useTableConfigContextValue();
  const { groupingStore: groupingDrawerStore } = useTableDrawerContextValue();

  return () => {
    const { aggregates, shares } = groupingStore.get();
    const { keys, mode, periods, totalsPlacement } = groupingDrawerStore.get();

    groupingDrawerStore.set({
      aggregates,
      keys,
      mode,
      periods,
      shares,
      totalsPlacement,
    });
  };
};
