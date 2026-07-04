import { useSyncExternalStore } from 'react';

import type { TableColumnsState } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: TableColumnsState<TData>) => TSelected,
) => {
  const { columnsStore } = useTableConfigContextValue();

  const state = useSyncExternalStore(
    columnsStore.subscribe,
    () => selector(columnsStore.get() as TableColumnsState<TData>),
    () =>
      selector(columnsStore.getServerSnapshot() as TableColumnsState<TData>),
  );

  return state;
};
