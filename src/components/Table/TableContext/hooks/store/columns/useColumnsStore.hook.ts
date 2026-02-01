import { useSyncExternalStore } from 'react';

import type { TableColumnsState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';

export const useColumnsStore = <TSelected, TData = unknown>(
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
