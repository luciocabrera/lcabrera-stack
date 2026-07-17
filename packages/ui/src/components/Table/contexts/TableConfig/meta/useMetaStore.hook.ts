import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

export const useMetaStore = <TSelected>(
  selector: (state: TableMetaState) => TSelected,
) => {
  const { metaStore } = useTableConfigContextValue();

  return useStoreSelector({
    fallback: {} as TableMetaState,
    selector,
    store: metaStore,
  });
};
