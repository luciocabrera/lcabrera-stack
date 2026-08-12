import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

export const useGroupingStore = <TSelected>(
  selector: (state: TableGroupingState) => TSelected,
) => {
  const { groupingStore } = useTableConfigContextValue();

  return useStoreSelector({ selector, store: groupingStore });
};
