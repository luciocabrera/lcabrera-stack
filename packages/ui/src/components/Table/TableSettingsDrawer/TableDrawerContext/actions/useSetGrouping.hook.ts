import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { applyGroupingReducer } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * The single write path for the drawer's grouping draft: hand it a function from the
 * staged configuration to the next one, and it stages the result.
 * Internal to `actions/` for the reason its live twin `useSetTableGrouping` is — the named
 * actions beside it are what surfaces call, so no component computes grouping state for
 * itself.
 */
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
