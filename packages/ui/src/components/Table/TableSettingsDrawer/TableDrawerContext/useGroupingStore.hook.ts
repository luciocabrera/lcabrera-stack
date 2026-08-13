import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import { useTableDrawerContextValue } from './useTableDrawerContextValue.hook';

export const useGroupingStore = <TSelected>(
  selector: (state: TableGroupingState) => TSelected,
) => {
  const { groupingStore } = useTableDrawerContextValue();

  return useStoreSelector({ selector, store: groupingStore });
};
