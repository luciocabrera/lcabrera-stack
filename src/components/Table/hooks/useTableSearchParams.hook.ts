import { useSearchParams } from 'react-router';

import { encodeStateToURL } from '@/utils/urlState';

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

export const useTableSearchParams = ({
  isEnabled,
  persistenceKey,
}: UseTableSearchParamsArgs) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial state from URL synchronously (before first render)
  // const initialState = (() => {
  //   if (!isEnabled) return;

  //   return readStateFromURL({
  //     convertArraysToSets: ['columnVisibility'],
  //     key: `${persistenceKey}-${PARAM_KEY}`,
  //     searchParams,
  //   }) as Partial<TableSearchParamsState> | undefined;
  // })();

  const updateURLState = ({
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
    const hasTableState = tableState.columnOrder ?? tableState.columnVisibility;

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

    setSearchParams(newParams);
  };

  return {
    // initialState,
    updateURLState,
  };
};
