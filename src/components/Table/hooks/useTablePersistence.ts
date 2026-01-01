import { useCallback, useEffect } from 'react';

import { parseCookies } from '@/utils/theme-cookie.util';

import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  PaginationState,
  SortingState,
  StorageType,
  TablePersistenceConfig,
} from '../TableContext';

const PERSISTENCE_VERSION = 1;

/**
 * Get storage key with prefix
 */
const getStorageKey = (persistenceKey: string) =>
  `table-state-${persistenceKey}`;

/**
 * Read from localStorage (extracted for reuse)
 */
const readFromLocalStorage = (key: string): string | undefined => {
  if (typeof localStorage === 'undefined') return undefined;

  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

/**
 * Read persisted column sizing synchronously (for SSR-safe initialization)
 *
 * This function can be called during component initialization to read
 * persisted column widths without waiting for useEffect.
 */
export const getPersistedColumnSizing = (
  persistenceKey: string,
): ColumnSizingState => {
  if (typeof localStorage === 'undefined') return {};

  const sliceKey = `${getStorageKey(persistenceKey)}-columnSizing`;
  const rawValue = readFromLocalStorage(sliceKey);

  if (rawValue) {
    try {
      const parsed = JSON.parse(rawValue) as {
        value: ColumnSizingState;
        version: number;
      };
      if (parsed.version === PERSISTENCE_VERSION) {
        return parsed.value;
      }
    } catch {
      // Invalid JSON, return empty
    }
  }

  return {};
};

type PersistedState = {
  columnFilters?: ColumnFiltersState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  pagination?: PaginationState;
  sorting?: SortingState;
  version: number;
};

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
 * Read from cookie
 */
const readFromCookie = (key: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  const cookies = parseCookies(document.cookie);
  return cookies[key];
};

type WriteToCookieArgs = {
  key: string;
  value: string;
};

/**
 * Write to cookie (expires in 1 year)
 */
const writeToCookie = ({ key, value }: WriteToCookieArgs) => {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const cookieValue = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  // Using assignment is required for cookie setting
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = cookieValue;
};

type WriteToLocalStorageArgs = {
  key: string;
  value: string;
};

/**
 * Write to localStorage
 */
const writeToLocalStorage = ({ key, value }: WriteToLocalStorageArgs) => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or disabled
  }
};

type ReadPersistedStateArgs = {
  config: TablePersistenceConfig;
  persistenceKey: string;
};

/**
 * Read persisted state from storage
 */
const readPersistedState = ({
  config,
  persistenceKey,
}: ReadPersistedStateArgs): Partial<PersistedState> => {
  const result: Partial<PersistedState> = {};
  const storageKey = getStorageKey(persistenceKey);

  // Try to read from each configured storage type
  const slices: (keyof TablePersistenceConfig)[] = [
    'sorting',
    'columnFilters',
    'columnPinning',
    'columnSizing',
    'pagination',
  ];

  for (const slice of slices) {
    const storageType = config[slice];
    if (!storageType) continue;

    const sliceKey = `${storageKey}-${slice}`;
    const rawValue =
      storageType === 'cookie'
        ? readFromCookie(sliceKey)
        : readFromLocalStorage(sliceKey);

    if (rawValue) {
      try {
        const parsed = JSON.parse(rawValue) as {
          value: unknown;
          version: number;
        };
        if (parsed.version === PERSISTENCE_VERSION) {
          result[slice] = parsed.value as never;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }

  return result;
};

type WriteStateSliceArgs = {
  persistenceKey: string;
  slice: keyof TablePersistenceConfig;
  storageType: StorageType;
  value: unknown;
};

/**
 * Write state slice to storage
 */
const writeStateSlice = ({
  persistenceKey,
  slice,
  storageType,
  value,
}: WriteStateSliceArgs) => {
  const sliceKey = `${getStorageKey(persistenceKey)}-${slice}`;
  const serialized = JSON.stringify({ value, version: PERSISTENCE_VERSION });

  if (storageType === 'cookie') {
    writeToCookie({ key: sliceKey, value: serialized });
  } else {
    writeToLocalStorage({ key: sliceKey, value: serialized });
  }
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
