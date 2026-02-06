import { readFromCookie, readFromLocalStorage } from '@/utils/storage';

import type { TablePersistenceConfig } from '../Table.types';
import type { PersistedState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

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
          result[slice] = (
            slice === 'columnVisibility' && Array.isArray(parsed.value)
              ? new Set(parsed.value as string[])
              : parsed.value
          ) as never;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }

  return result;
};
