import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { encodeStateToURL, readStateFromURL } from '@/utils/urlState';

import type {
  ColumnOrderState,
  ColumnVisibilityState,
  SortingState,
} from '../Table.types';

type TableSearchParamsState = {
  columnOrder?: ColumnOrderState;
  columnVisibility?: ColumnVisibilityState;
  sorting?: SortingState;
};

type UseTableSearchParamsArgs = {
  columnOrder: ColumnOrderState;
  columnVisibility: ColumnVisibilityState;
  isEnabled: boolean;
  persistenceKey: string;
  sorting: SortingState;
};

const PARAM_KEY = 'tableState';
const DEBOUNCE_MS = 500;

/**
 * Hook to sync table state with URL search params
 * Uses Base64 encoding for compact URL representation
 * Priority: URL params > cookies (cookies handled by useTablePersistence)
 */
export const useTableSearchParams = ({
  columnOrder,
  columnVisibility,
  isEnabled,
  persistenceKey,
  sorting,
}: UseTableSearchParamsArgs) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasInitialized = useRef(false);

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

  // Sync state changes to URL (debounced)
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
      const state: TableSearchParamsState = {
        columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
        columnVisibility:
          columnVisibility.size > 0 ? columnVisibility : undefined,
        sorting: sorting.length > 0 ? sorting : undefined,
      };

      // Only update URL if there's actually state to persist
      const hasState =
        state.columnOrder ?? state.columnVisibility ?? state.sorting;

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          const key = `${persistenceKey}-${PARAM_KEY}`;

          if (hasState) {
            newParams.set(key, encodeStateToURL(state));
          } else {
            newParams.delete(key);
          }

          return newParams;
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { replace: true }, // Use replace to avoid polluting browser history
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
    sorting,
    isEnabled,
    persistenceKey,
    setSearchParams,
  ]);

  return {
    initialState,
  };
};
