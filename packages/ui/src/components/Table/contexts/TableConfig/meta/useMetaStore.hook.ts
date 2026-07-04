import { useSyncExternalStore } from 'react';

import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

export const useMetaStore = <TSelected>(
  selector: (state: TableMetaState) => TSelected,
) => {
  const { metaStore } = useTableConfigContextValue();

  const state = useSyncExternalStore(
    metaStore.subscribe,
    () => selector(metaStore.get() ?? ({} as TableMetaState)),
    () => selector(metaStore.getServerSnapshot() ?? ({} as TableMetaState)),
  );

  return state;
};
