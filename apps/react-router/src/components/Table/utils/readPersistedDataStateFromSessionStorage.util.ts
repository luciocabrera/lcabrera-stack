import { readFromSessionStorage } from '@/utils/storage';

import type { PersistedDataState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import {
  DATA_STATE_SESSION_KEY_SUFFIX,
  PERSISTENCE_VERSION,
} from './persistence.constants';

type ReadPersistedDataStateFromSessionStorageArgs = {
  readonly persistenceKey: string;
};

/**
 * Read persisted table data state from sessionStorage (client-only, tab-scoped).
 * Returns undefined when no data exists or when the payload is invalid.
 */
export const readPersistedDataStateFromSessionStorage = <
  TData = Record<string, unknown>,
>({
  persistenceKey,
}: ReadPersistedDataStateFromSessionStorageArgs):
  | PersistedDataState<TData>
  | undefined => {
  const key = `${getStorageKey({ persistenceKey })}-${DATA_STATE_SESSION_KEY_SUFFIX}`;
  const rawValue = readFromSessionStorage({ key });

  if (!rawValue) return undefined;

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
      value: unknown;
      version: number;
    };

    if (parsed.version === PERSISTENCE_VERSION) {
      return parsed.value as PersistedDataState<TData>;
    }
  } catch {
    // Invalid JSON - skip
  }

  return undefined;
};
