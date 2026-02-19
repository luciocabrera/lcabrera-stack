import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type { ColumnFiltersState, DataKey } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { usePersistCookieAction } from '@/components/Table/hooks';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { serializeStateSlice } from '@/components/Table/utils';

type SetColumnFilterArgs<TData> = {
  columnKey: DataKey<TData>;
  filter?: ColumnFilter | null;
};

/**
 * Hook to update a single column filter
 *
 * Persists the filter state to a cookie via server action (Set-Cookie header)
 * using useFetcher, ensuring the cookie is set server-side.
 */
export const useSetColumnFilter =  <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const [, setSearchParams] = useSearchParams();
  const persistCookie = usePersistCookieAction();

  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(({ columnKey, filter }: SetColumnFilterArgs<TData>) => {
    let columnFilters = {} as ColumnFiltersState<TData>;
    const current = (columnsState?.columnFilters ?? {}) as ColumnFiltersState<TData>;
    if (filter === null || filter === undefined) {
      // TODO: Improve later, i don't like this pattern
      // Remove the filter by creating new object without it
      const { [columnKey]: unusedFilter, ...rest } = current;
      void unusedFilter; // Explicitly mark as intentionally unused
      columnFilters = rest as ColumnFiltersState<TData>;
    } else {
      columnFilters = { ...current, [columnKey]: filter };
    }

    // Persist to cookie via server action (Set-Cookie header)
    const { key, value } = serializeStateSlice({
      persistenceKey,
      slice: 'columnFilters',
      value: columnFilters,
    });
    persistCookie({ key, value });

    // Update URL search params
    setSearchParams((params) => {
      if (Object.keys(columnFilters).length > 0) {
        params.set('filters', JSON.stringify(columnFilters));
      } else {
        params.delete('filters');
      }
      return params;
    });

    // Update table context state
    columnsStore.set({ columnFilters });
  }, [columnsStore, persistCookie, persistenceKey, setSearchParams, columnsState]);
};
