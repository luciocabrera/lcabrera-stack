import { useCallback, useEffect } from 'react';

import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  PaginationState,
  SortingState,
  TablePersistenceConfig,
} from '../TableContext';
import type { PersistedState } from './tablePersistence.helper';

import {
  readPersistedState,
  writeStateSlice,
} from './tablePersistence.helper';

type UseTablePersistenceArgs = {
  /** Configuration for which slices to persist and how */
  config: TablePersistenceConfig;
  /** Callback to get current state for a slice */
  getState: () => {
    columnFilters: ColumnFiltersState;
    columnPinning: ColumnPinningState;
    columnSizing: ColumnSizingState;
    pagination: PaginationState;
    sorting: SortingState;
  };
  /** Required key for storage */
  persistenceKey: string;
  /** Callback to restore state from persistence */
  restoreState: (state: Partial<PersistedState>) => void;
};

/**
 * Hook for persisting table state to cookie or localStorage
 *
 * @example
 * ```tsx
 * useTablePersistence({
 *   persistenceKey: 'car-sales-table',
 *   config: {
 *     sorting: 'localStorage',
 *     columnFilters: 'cookie',
 *   },
 *   getState: () => tableStore.get(),
 *   restoreState: (state) => tableStore.set(state),
 * });
 * ```
 */
export const useTablePersistence = ({
  config,
  getState,
  persistenceKey,
  restoreState,
}: UseTablePersistenceArgs) => {
  // Hydrate on mount
  useEffect(() => {
    const persisted = readPersistedState({ config, persistenceKey });
    if (Object.keys(persisted).length > 0) {
      restoreState(persisted);
    }
  }, [persistenceKey, config, restoreState]);

  // Persist specific slice
  const persistSlice = useCallback(
    (slice: keyof TablePersistenceConfig) => {
      const storageType = config[slice];
      if (!storageType) return;

      const currentState = getState();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = currentState[slice];
      writeStateSlice({ persistenceKey, slice, storageType, value });
    },
    [config, getState, persistenceKey],
  );

  // Persist all configured slices
  const persistAll = useCallback(() => {
    const slices: (keyof TablePersistenceConfig)[] = [
      'sorting',
      'columnFilters',
      'columnPinning',
      'columnSizing',
      'pagination',
    ];

    for (const slice of slices) {
      persistSlice(slice);
    }
  }, [persistSlice]);

  return {
    persistAll,
    persistSlice,
  };
};
