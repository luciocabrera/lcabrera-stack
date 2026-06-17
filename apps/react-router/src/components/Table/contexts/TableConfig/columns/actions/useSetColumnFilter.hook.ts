import type { DataKey } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

import { resolveColumnFilterUpdate } from './utils';

type SetColumnFilterArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: ColumnFilter | null;
};

/**
 * Hook to update a single column filter
 *
 * Persists the filter state to a cookie via server action (Set-Cookie header)
 * using useFetcher, ensuring the cookie is set server-side.
 */
export const useSetColumnFilter = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, filter }: SetColumnFilterArgs<TData>) => {
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
    const { columnFilters, persistenceEntry } =
      resolveColumnFilterUpdate<TData>({
        columnFiltersState: columnsState?.columnFilters,
        columnKey,
        filter,
        persistenceKey,
      });

    // Persist to cookie and sync URL params in one action.
    // Abort before loading/state changes when persistence would be oversized.
    if (!persistTableState(persistenceEntry)) {
      return;
    }

    // Show loading feedback immediately
    dataStore.set({ isLoading: true });

    // Update table context state
    columnsStore.set({ columnFilters });
  };
};
