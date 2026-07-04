import { readFromSessionStorage } from '@repo/ui/utils/storage';

import type { PersistedUiState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import {
  PERSISTENCE_VERSION,
  UI_STATE_SESSION_KEY_SUFFIX,
} from './persistence.constants';

type ReadPersistedUiStateFromSessionStorageArgs = {
  readonly persistenceKey: string;
};

/**
 * Read persisted meta UI state from sessionStorage (client-only, tab-scoped).
 * Returns an empty object on SSR or if no session data exists.
 */
export const readPersistedUiStateFromSessionStorage = ({
  persistenceKey,
}: ReadPersistedUiStateFromSessionStorageArgs): PersistedUiState => {
  const key = `${getStorageKey({ persistenceKey })}-${UI_STATE_SESSION_KEY_SUFFIX}`;
  const rawValue = readFromSessionStorage({ key });

  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
      value: unknown;
      version: number;
    };
    if (parsed.version === PERSISTENCE_VERSION) {
      return parsed.value as PersistedUiState;
    }
  } catch {
    // Invalid JSON — skip
  }

  return {};
};
