import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useResetGrouping = () => {
  const { groupingStore } = useTableConfigContextValue();
  const { groupingStore: groupingDrawerStore } = useTableDrawerContextValue();

  return () => {
    groupingDrawerStore.set(groupingStore.get());
  };
};
