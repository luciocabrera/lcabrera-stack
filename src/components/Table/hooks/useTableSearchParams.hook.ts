import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { encodeStateToURL, readStateFromURL } from '@/utils/urlState';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnVisibilityState,
  SortingState,
} from '../Table.types';

type TableSearchParamsState = {
  columnOrder?: ColumnOrderState;
  columnVisibility?: ColumnVisibilityState;
};

type UseTableSearchParamsArgs = {
  columnFilters: ColumnFiltersState;
  columnOrder: ColumnOrderState;
  columnVisibility: ColumnVisibilityState;
  isEnabled: boolean;
  persistenceKey: string;
  sorting: SortingState;
};

const PARAM_KEY = 'tableState';
const DEBOUNCE_MS = 0;

/**
 * Hook to sync table state with URL search params
 * - columnOrder and columnVisibility use Base64 encoding (tableState param)
 * - sorting and filters use standalone JSON params for readability
 * Priority: URL params > cookies (cookies handled by useTablePersistence)
 */
export const useTableSearchParams = ({
  columnFilters,
  columnOrder,
  columnVisibility,
  isEnabled,
  persistenceKey,
  sorting,
}: UseTableSearchParamsArgs) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasInitialized = useRef(false);
  const prevSortingRef = useRef<SortingState>(sorting);
  const prevFiltersRef = useRef<ColumnFiltersState>(columnFilters);

  // Read initial state from URL synchronously (before first render)
  // Store as plain variable instead of ref to avoid ref access during render
  const initialState = (() => {
    if (!isEnabled) return;

    return readStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      key: `${persistenceKey}-${PARAM_KEY}`,
      searchParams,
    }) as Partial<TableSearchParamsState> | undefined;
  })();

  // Immediate update for sorting and filters (no debounce)
  // This is critical because the loader reads these from URL and needs fresh values
  useEffect(() => {
    if (!isEnabled) return;
    if (!hasInitialized.current) return;

    const didSortingChange =
      JSON.stringify(sorting) !== JSON.stringify(prevSortingRef.current);
    const didFiltersChange =
      JSON.stringify(columnFilters) !== JSON.stringify(prevFiltersRef.current);

    if (!didSortingChange && !didFiltersChange) return;

    prevSortingRef.current = sorting;
    prevFiltersRef.current = columnFilters;

    const hasFilters = Object.keys(columnFilters).length > 0;
    const hasSorting = sorting.length > 0;

    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);

        // Handle filters as standalone param (readable JSON)
        if (hasFilters) {
          newParams.set('filters', JSON.stringify(columnFilters));
        } else {
          newParams.delete('filters');
        }

        // Handle sorting as standalone param (readable JSON)
        if (hasSorting) {
          newParams.set('sort', JSON.stringify(sorting));
        } else {
          newParams.delete('sort');
        }

        return newParams;
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { replace: true },
    );
  }, [sorting, columnFilters, isEnabled, setSearchParams]);

  // Debounced update for column order/visibility (these don't affect loader)
  useEffect(() => {
    if (!isEnabled) return;

    // Skip first update to avoid overwriting URL on mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      // Base64 encoded state (columnOrder, columnVisibility only)
      const tableState: TableSearchParamsState = {
        columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
        columnVisibility:
          columnVisibility.size > 0 ? columnVisibility : undefined,
      };

      const hasTableState = tableState.columnOrder ?? tableState.columnVisibility;

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          const key = `${persistenceKey}-${PARAM_KEY}`;

          // Handle Base64 tableState (columnOrder, columnVisibility)
          if (hasTableState) {
            newParams.set(key, encodeStateToURL(tableState));
          } else {
            newParams.delete(key);
          }

          return newParams;
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { replace: true },
      );
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    columnOrder,
    columnVisibility,
    isEnabled,
    persistenceKey,
    setSearchParams,
  ]);

  return {
    initialState,
  };
};
