import { useCallback, useEffect } from 'react';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  PaginationState,
  SortingState,
  TablePersistenceConfig,
} from '../Table.types';

import {
  type PersistedState,
  readPersistedState,
  writeStateSlice,
} from '../utils';

type UseTablePersistenceArgs = {
  /** Configuration for which slices to persist and how */
  config: TablePersistenceConfig;
  /** Callback to get current state for a slice */
  getState: () => {
    columnFilters: ColumnFiltersState;
    columnOrder: ColumnOrderState;
    columnPinning: ColumnPinningState;
    columnSizing: ColumnSizingState;
    columnVisibility: ColumnVisibilityState;
    pagination: PaginationState;
    sorting: SortingState;
  };
  /** Required key for storage */
  persistenceKey: string;
  /** Callback to restore state from persistence */
  restoreState: (state: Partial<PersistedState>) => void;
  /**
   * Skip hydration from cookies on mount.
   * Set to true when the loader already handles initial state from URL/cookies.
   * @default false
   */
  skipHydration?: boolean;
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
  skipHydration = false,
}: UseTablePersistenceArgs) => {
  // Hydrate on mount (only if not skipped)
  // Skip when loader already handles initial state from URL/cookies
  useEffect(() => {
    if (skipHydration) return;
    
    const persisted = readPersistedState({ config, persistenceKey });
    if (Object.keys(persisted).length > 0) {
      restoreState(persisted);
    }
  }, [persistenceKey, config, restoreState, skipHydration]);

  // Persist specific slice
  const persistSlice = useCallback(
    (slice: keyof TablePersistenceConfig) => {
      const storageType = config[slice];
      if (!storageType) return;

      const currentState = getState();
      // eslint-disable-next-line security/detect-object-injection
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
      'columnOrder',
      'columnPinning',
      'columnSizing',
      'columnVisibility',
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
