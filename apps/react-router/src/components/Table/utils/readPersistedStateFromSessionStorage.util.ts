import { readFromSessionStorage } from '@/utils/storage';

import type { PersistedState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type ReadPersistedStateFromSessionStorageArgs = {
  readonly persistenceKey: string;
};

/**
 * Read persisted column state slices from sessionStorage (client-only, tab-scoped).
 * Uses the same key format and version check as the cookie reader.
 * Returns an empty object on SSR or if no session data exists.
 */
export const readPersistedStateFromSessionStorage = ({
  persistenceKey,
}: ReadPersistedStateFromSessionStorageArgs): Partial<PersistedState> => {
  const result: { -readonly [K in keyof PersistedState]?: PersistedState[K] } =
    {};
  const storageKey = getStorageKey({ persistenceKey });

  const slices: (keyof Omit<PersistedState, 'version'>)[] = [
    'sorting',
    'columnFilters',
    'columnOrder',
    'columnPinning',
    'columnSizing',
    'columnVisibility',
  ];

  for (const slice of slices) {
    const sliceKey = `${storageKey}-${slice}`;
    const rawValue = readFromSessionStorage({ key: sliceKey });

    if (rawValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
          value: unknown;
          version: number;
        };
        if (parsed.version === PERSISTENCE_VERSION) {
          result[slice] = (
            slice === 'columnVisibility' && Array.isArray(parsed.value)
              ? new Set(parsed.value as string[])
              : parsed.value
          ) as never;
        }
      } catch {
        // Invalid JSON — skip
      }
    }
  }

  return result;
};
