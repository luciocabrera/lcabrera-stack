import { useSyncExternalStore } from 'react';

import type { FiltersDataState } from '@/components/Table/Table.types';

import { useTableDataContextValue } from './useFiltersDataContextValue.hook';

export const useFiltersStore = <TSelected, TData = unknown>(
  selector: (state: FiltersDataState<TData>) => TSelected,
) => {
  const { filtersDataStore } = useTableDataContextValue();

  const state = useSyncExternalStore(
    filtersDataStore.subscribe,
    () => selector(filtersDataStore.get() as FiltersDataState<TData>),
    () =>
      selector(filtersDataStore.getServerSnapshot() as FiltersDataState<TData>),
  );

  return state;
};
