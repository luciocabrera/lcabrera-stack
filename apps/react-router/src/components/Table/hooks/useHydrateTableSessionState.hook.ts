import { useEffect } from 'react';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

import {
  deriveColumnViewState,
  getStaticColumnKeys,
  readPersistedStateFromSessionStorage,
  readPersistedUiStateFromSessionStorage,
} from '../utils';

type UseHydrateTableSessionStateArgs<TData extends Record<string, unknown>> = {
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
  readonly persistenceKey: string;
};

/**
 * Reads tab-scoped sessionStorage state after client mount and merges it into
 * both stores. This overwrites the server-provided initial state with the
 * per-tab working copy so that a tab refresh restores exactly where the user
 * left off without affecting other tabs.
 *
 * - Column slices: order, pinning, sizing, visibility, sorting, filters
 * - Meta UI slices: drawer open/pinned state, selected tab, expanded filters
 *
 * Called once per table mount inside TableConfigProvider.
 */
export const useHydrateTableSessionState = <
  TData extends Record<string, unknown>,
>({
  columnsStore,
  metaStore,
  persistenceKey,
}: UseHydrateTableSessionStateArgs<TData>): void => {
  useEffect(() => {
    if (persistenceKey === '') {
      return;
    }

    const columnState = readPersistedStateFromSessionStorage({
      persistenceKey,
    });
    const uiState = readPersistedUiStateFromSessionStorage({ persistenceKey });

    const hasColumnState = Object.keys(columnState).length > 0;
    const hasUiState = Object.keys(uiState).length > 0;

    if (hasColumnState) {
      const { columnVisibility, ...rest } = columnState;
      const currentColumnsState = columnsStore.get();

      const columns = currentColumnsState?.columns ?? [];
      const nextColumnFilters = (rest.columnFilters ??
        currentColumnsState?.columnFilters ??
        ({} as ColumnFiltersState<TData>)) as ColumnFiltersState<TData>;
      const nextColumnOrder = (rest.columnOrder ??
        currentColumnsState?.columnOrder ??
        ([] as ColumnOrderState<TData>)) as ColumnOrderState<TData>;
      const nextColumnPinning = (rest.columnPinning ??
        currentColumnsState?.columnPinning ??
        ({
          left: [],
          right: [],
        } as ColumnPinningState<TData>)) as ColumnPinningState<TData>;
      const nextColumnSizing = (rest.columnSizing ??
        currentColumnsState?.columnSizing ??
        ({} as ColumnSizingState<TData>)) as ColumnSizingState<TData>;
      const nextColumnVisibility = (columnVisibility ??
        currentColumnsState?.columnVisibility ??
        (new Set() as ColumnVisibilityState<TData>)) as ColumnVisibilityState<TData>;
      const nextSorting = (rest.sorting ??
        currentColumnsState?.sorting ??
        ([] as SortingState<TData>)) as SortingState<TData>;

      const {
        columnGroups,
        effectiveColumns,
        normalizedColumns,
        pinnedColumnOffsets,
      } = deriveColumnViewState<TData>({
        columnOrder: nextColumnOrder,
        columnPinning: nextColumnPinning,
        columns,
        columnSizing: nextColumnSizing,
        columnVisibility: nextColumnVisibility,
        sorting: nextSorting,
      });

      const nextColumnsState = {
        columnFilters: nextColumnFilters,
        columnGroups,
        columnOrder: nextColumnOrder,
        columnPinning: nextColumnPinning,
        columns,
        columnSizing: nextColumnSizing,
        columnVisibility: nextColumnVisibility,
        effectiveColumns,
        normalizedColumns,
        pinnedColumnOffsets,
        sorting: nextSorting,
        staticKeys: getStaticColumnKeys(columns),
      } as Partial<TableColumnsState<TData>>;

      console.log(
        'useHydrateTableSessionState: restoring column state from sessionStorage',
        {
          nextColumnsState,
        },
      );

      columnsStore.set(nextColumnsState);
    }

    if (hasUiState) {
      console.log(
        'useHydrateTableSessionState: restoring UI state from sessionStorage',
        {
          uiState,
        },
      );
      metaStore.set(uiState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps
  }, []);
};
