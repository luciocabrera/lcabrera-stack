import type { FiltersDataState } from '@repo/ui/components/Table/Table.types';

import { useSyncExternalStore } from 'react';

import { useFiltersDataContextValue } from '../useFiltersDataContextValue.hook';

export const useFiltersStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: FiltersDataState<TData>) => TSelected,
) => {
  const { filtersDataStore } = useFiltersDataContextValue();

  const state = useSyncExternalStore(
    filtersDataStore.subscribe,
    () => selector(filtersDataStore.get() as FiltersDataState<TData>),
    () =>
      selector(filtersDataStore.getServerSnapshot() as FiltersDataState<TData>),
  );

  return state;
};
