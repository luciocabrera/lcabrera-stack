import type { TableDataState } from '@repo/ui/components/Table/Table.types';

import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import { useTableDataContextValue } from './useTableDataContextValue.hook';

export const useDataStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: TableDataState<TData>) => TSelected,
) => {
  const { dataStore } = useTableDataContextValue<TData>();

  return useStoreSelector({ selector, store: dataStore });
};
