import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

export const useMetaStore = <TSelected>(
  selector: (state: TableMetaState) => TSelected,
) => {
  const { metaStore } = useTableConfigContextValue();

  return useStoreSelector({
    selector,
    store: metaStore,
  });
};
