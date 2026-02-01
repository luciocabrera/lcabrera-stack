import { useSyncExternalStore } from 'react';

import type { TableDataState } from '@/components/Table/Table.types';

import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

export const useDataStore = <TSelected, TData = unknown>(
  selector: (state: TableDataState<TData>) => TSelected,
) => {
  const { dataStore } = useTableDataContextValue();

  const state = useSyncExternalStore(
    dataStore.subscribe,
    () => selector(dataStore.get() as TableDataState<TData>),
    () => selector(dataStore.getServerSnapshot() as TableDataState<TData>),
  );

  return state;
};
