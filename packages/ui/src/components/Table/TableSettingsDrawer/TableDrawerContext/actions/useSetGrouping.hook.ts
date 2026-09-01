import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { applyGroupingReducer } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetGrouping = () => {
  const { groupingStore } = useTableDrawerContextValue();

  return (
    deriveNextGrouping: (current: TableGroupingState) => TableGroupingState,
  ) => {
    const result = applyGroupingReducer({
      deriveNextGrouping,
      existingGrouping: groupingStore.get(),
    });

    if (result.kind !== 'updated') return;

    groupingStore.set(result.grouping);
  };
};
