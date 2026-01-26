import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router';

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

type UpdateURLStateArgs = {
  columnFilters: ColumnFiltersState;
  columnOrder: ColumnOrderState;
  columnVisibility: ColumnVisibilityState;
  sorting: SortingState;
};

type UseTableSearchParamsArgs = {
  isEnabled: boolean;
  persistenceKey: string;
};

const PARAM_KEY = 'tableState';

/**
 * Hook to sync table state with URL search params (imperative approach)
 * - columnOrder and columnVisibility use Base64 encoding (tableState param)
 * - sorting and filters use standalone JSON params for readability
 * 
 * This hook provides an imperative function to update URL state,
 * rather than using effects. This avoids circular dependencies where
 * URL changes trigger loader reruns that could restore stale state.
 * 
 * Call `updateURLState` explicitly when user confirms changes (e.g., Accept button).
 */
export const useTableSearchParams = ({
  isEnabled,
  persistenceKey,
}: UseTableSearchParamsArgs) => {
  const [searchParams, setSearchParams] = useSearchParams();
  // const navigate = useNavigate();
  const location = useLocation();
  // const revalidator = useRevalidator();

  // Read initial state from URL synchronously (before first render)
  const initialState = (() => {
    if (!isEnabled) return;

    return readStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      key: `${persistenceKey}-${PARAM_KEY}`,
      searchParams,
    }) as Partial<TableSearchParamsState> | undefined;
  })();

  /**
   * Imperatively update URL with new table state.
   * Call this when user explicitly confirms changes (Accept/Apply).
   * 
   * Uses navigate() instead of setSearchParams() to perform an atomic
   * URL update that triggers the loader immediately, avoiding race
   * conditions with effects that might re-add removed params.
   */
  const updateURLState = useCallback(
    ({
      columnFilters,
      columnOrder,
      columnVisibility,
      sorting,
    }: UpdateURLStateArgs) => {
      if (!isEnabled) return;

      const hasFilters = Object.keys(columnFilters).length > 0;
      const hasSorting = sorting.length > 0;

      // Debug logging
      console.log('[updateURLState] Called with:', {
        filtersCount: Object.keys(columnFilters).length,
        hasFilters,
        hasSorting,
        sortingLength: sorting.length,
      });

      // Build new URL params from scratch to ensure clean state
      const newParams = new URLSearchParams();
      const key = `${persistenceKey}-${PARAM_KEY}`;

      // Preserve existing params that we don't manage
      for (const [paramKey, value] of searchParams.entries()) {
        if (paramKey !== key && paramKey !== 'sort' && paramKey !== 'filters') {
          newParams.set(paramKey, value);
        }
      }

      const tableState: TableSearchParamsState = {
        columnOrder: columnOrder.length > 0 ? columnOrder : void 0,
        columnVisibility: columnVisibility.size > 0 ? columnVisibility : void 0,
      };
      const hasTableState =
        tableState.columnOrder ?? tableState.columnVisibility;

      // Handle Base64 tableState (columnOrder, columnVisibility)
      if (hasTableState) {
        newParams.set(key, encodeStateToURL(tableState));
      }

      // Handle filters as standalone param (readable JSON)
      if (hasFilters) {
        newParams.set('filters', JSON.stringify(columnFilters));
      }

      // Handle sorting as standalone param (readable JSON)
      if (hasSorting) {
        newParams.set('sort', JSON.stringify(sorting));
      }

      console.log('[updateURLState] Navigating with params:', {
        newFilters: newParams.get('filters'),
        newSort: newParams.get('sort'),
      });

      setSearchParams(newParams);

      const newSearch = newParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      
      console.log('[updateURLState] New URL:', newUrl);
      console.log('[updateURLState] Current location.pathname:', location.pathname);
      console.log('[updateURLState] newParams.toString():', newSearch);
      console.log('[updateURLState] Will navigate to:', newUrl);
      
      // Use navigate to update URL and trigger loader
      // Then explicitly revalidate to ensure loader runs with new params
      // void navigate(newUrl, { replace: true, preventScrollReset: true });
      
      // Force loader revalidation after URL update
      // This ensures the loader sees the new URL params
      queueMicrotask(() => {
        console.log('[updateURLState] Calling revalidator.revalidate()');
        // revalidator.revalidate();
      });
    },
    [isEnabled, persistenceKey, setSearchParams, location.pathname, searchParams],
  );

  return {
    initialState,
    updateURLState,
  };
};
