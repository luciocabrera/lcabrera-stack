import type { TableMetaState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

export const useMetaStore = <TSelected>(
  selector: (state: TableMetaState) => TSelected,
) => {
  const { metaStore } = useTableConfigContextValue();

  return useStoreSelector({
    selector,
    store: metaStore,
  });
};
