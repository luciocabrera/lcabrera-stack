import {
  readFromCookie,
  readFromLocalStorage,
  writeToCookie,
  writeToLocalStorage,
} from '@/utils/storage';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  PaginationState,
  SortingState,
  StorageType,
  TablePersistenceConfig,
} from '../TableContext';

export const PERSISTENCE_VERSION = 1;

export type PersistedState = {
  columnFilters?: ColumnFiltersState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  columnVisibility?: ColumnVisibilityState;
  pagination?: PaginationState;
  sorting?: SortingState;
  version: number;
};

type GetStorageKeyArgs = {
  persistenceKey: string;
};

/**
 * Get storage key with prefix
 */
export const getStorageKey = ({
  persistenceKey,
}: GetStorageKeyArgs): string => `table-state-${persistenceKey}`;

type ReadPersistedStateArgs = {
  config: TablePersistenceConfig;
  persistenceKey: string;
};

/**
 * Read persisted state from storage
 */
export const readPersistedState = ({
  config,
  persistenceKey,
}: ReadPersistedStateArgs): Partial<PersistedState> => {
  const result: Partial<PersistedState> = {};
  const storageKey = getStorageKey({ persistenceKey });

  // Try to read from each configured storage type
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
    const storageType = config[slice];
    if (!storageType) continue;

    const sliceKey = `${storageKey}-${slice}`;
    const rawValue =
      storageType === 'cookie'
        ? readFromCookie({ key: sliceKey })
        : readFromLocalStorage({ key: sliceKey });

    if (rawValue) {
      try {
        const parsed = JSON.parse(rawValue) as {
          value: unknown;
          version: number;
        };
        if (parsed.version === PERSISTENCE_VERSION) {
          // Convert array to Set for columnVisibility
          // eslint-disable-next-line security/detect-object-injection
          result[slice] = (slice === 'columnVisibility' && Array.isArray(parsed.value)
            ? new Set(parsed.value as string[])
            : parsed.value) as never;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }

  return result;
};

type ReadPersistedStateFromCookieArgs = {
  cookieString?: string;
  persistenceKey: string;
};

/**
 * Read persisted state from cookies synchronously (SSR-safe)
 *
 * This function can be called during SSR to initialize table state
 * from cookies sent with the request.
 *
 * @example
 * ```tsx
 * // In browser
 * const state = readPersistedStateFromCookie({ persistenceKey: 'my-table' });
 *
 * // In SSR (React Router loader)
 * export async function loader({ request }) {
 *   const cookieHeader = request.headers.get('Cookie');
 *   const state = readPersistedStateFromCookie({
 *     persistenceKey: 'my-table',
 *     cookieString: cookieHeader
 *   });
 *   return { initialTableState: state };
 * }
 * ```
 */
export const readPersistedStateFromCookie = ({
  cookieString,
  persistenceKey,
}: ReadPersistedStateFromCookieArgs): Partial<PersistedState> => {
  const result: Partial<PersistedState> = {};
  const storageKey = getStorageKey({ persistenceKey });

  const slices: (keyof Omit<PersistedState, 'version'>)[] = [
    'sorting',
    'columnFilters',
    'columnOrder',
    'columnPinning',
    'columnSizing',
    'columnVisibility',
    'pagination',
  ];

  for (const slice of slices) {
    const sliceKey = `${storageKey}-${slice}`;
    const rawValue = readFromCookie({ cookieString, key: sliceKey });

    if (rawValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
          value: unknown;
          version: number;
        };
        if (parsed.version === PERSISTENCE_VERSION) {
          // Convert array to Set for columnVisibility
          // eslint-disable-next-line security/detect-object-injection
          result[slice] = (slice === 'columnVisibility' && Array.isArray(parsed.value)
            ? new Set(parsed.value as string[])
            : parsed.value) as never;
        }
      } catch {
        // Invalid JSON, skip
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
 * Special handling for ColumnVisibilityState (Set → Array for JSON serialization)
 */
export const writeStateSlice = ({
  persistenceKey,
  slice,
  storageType,
  value,
}: WriteStateSliceArgs): void => {
  const sliceKey = `${getStorageKey({ persistenceKey })}-${slice}`;
  
  // Convert Set to Array for columnVisibility
  const serializableValue = slice === 'columnVisibility' && value instanceof Set
    ? [...value]
    : value;
    
  const serialized = JSON.stringify({ value: serializableValue, version: PERSISTENCE_VERSION });

  if (storageType === 'cookie') {
    writeToCookie({ key: sliceKey, value: serialized });
  } else {
    writeToLocalStorage({ key: sliceKey, value: serialized });
  }
};

/**
 * @deprecated Use readPersistedStateFromCookie instead for SSR support
 *
 * Read persisted column sizing synchronously (for SSR-safe initialization)
 *
 * This function can be called during component initialization to read
 * persisted column widths without waiting for useEffect.
 */
export const getPersistedColumnSizing = ({
  persistenceKey,
}: GetStorageKeyArgs): ColumnSizingState => {
  if (typeof localStorage === 'undefined') return {};

  const sliceKey = `${getStorageKey({ persistenceKey })}-columnSizing`;
  const rawValue = readFromLocalStorage({ key: sliceKey });

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
