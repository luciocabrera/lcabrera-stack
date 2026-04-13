import { useSyncExternalStore } from 'react';

import type { TableDataState } from '@/components/Table/Table.types';

import { useTableDataContextValue } from './useTableDataContextValue.hook.ts';

export const useDataStore = <TSelected, TData = Record<string, unknown>>(
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
