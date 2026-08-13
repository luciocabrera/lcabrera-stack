import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { applyGroupingReducer } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * The single write path for the drawer's grouping draft: hand it a function
 * from the staged configuration to the next one, and it stages the result.
 *
 * Internal to `actions/` for the reason its live twin `useSetTableGrouping` is
 * — the named actions beside it are what surfaces call, so no component
 * computes grouping state for itself.
 *
 * It resolves the change through `applyGroupingReducer`, the same shape the
 * live path uses, so the drawer refuses exactly what Accept would refuse (an
 * over-deep or repeating key list) and normalizes exactly what Accept would
 * normalize (dropping the aggregates with the last key). Staging a
 * configuration the commit would then reject is the failure mode that shares
 * the resolution rather than copying its rules.
 *
 * What it deliberately does not do is persist or navigate: that is the whole
 * point of the draft, and the entire difference from `useSetTableGrouping`.
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
