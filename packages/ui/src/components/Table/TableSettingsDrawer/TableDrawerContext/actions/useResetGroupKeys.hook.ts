import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useResetGroupKeys = () => {
  const { groupingStore } = useTableConfigContextValue();
  const { groupingStore: groupingDrawerStore } = useTableDrawerContextValue();

  return () => {
    const { keys, periods } = groupingStore.get();
    const { aggregates, mode, shares, totalsPlacement } =
      groupingDrawerStore.get();

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
