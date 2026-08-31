import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useResetGrouping = () => {
  const { groupingStore } = useTableConfigContextValue();
  const { groupingStore: groupingDrawerStore } = useTableDrawerContextValue();

  return () => {
    const { aggregates, keys, mode, periods, shares } = groupingStore.get();

    groupingDrawerStore.set({ aggregates, keys, mode, periods, shares });
  };
};
