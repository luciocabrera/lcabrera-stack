import type { FiltersDataState } from '@lcabrera/ui/components/Table/Table.types';

import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

import { useFiltersDataContextValue } from '../useFiltersDataContextValue.hook';

export const useFiltersStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: FiltersDataState<TData>) => TSelected,
) => {
  const { filtersDataStore } = useFiltersDataContextValue<TData>();

  return useStoreSelector({ selector, store: filtersDataStore });
};
