import type { TableGroupExpansionState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

export const useExpansionStore = <TSelected>(
  selector: (state: TableGroupExpansionState) => TSelected,
) => {
  const { expansionStore } = useTableConfigContextValue();

  return useStoreSelector({ selector, store: expansionStore });
};
