import { writeToSessionStorage } from '@/utils/storage';

import type { PersistedUiState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import {
  PERSISTENCE_VERSION,
  UI_STATE_SESSION_KEY_SUFFIX,
} from './persistence.constants';

type WritePersistedUiStateToSessionStorageArgs = {
  readonly persistenceKey: string;
  readonly uiState: PersistedUiState;
};

/**
 * Persist meta UI state to sessionStorage (client-only, tab-scoped).
 * Stored as a single versioned JSON blob under the uiState key.
 */
export const writePersistedUiStateToSessionStorage = ({
  persistenceKey,
  uiState,
}: WritePersistedUiStateToSessionStorageArgs): void => {
  const key = `${getStorageKey({ persistenceKey })}-${UI_STATE_SESSION_KEY_SUFFIX}`;
  const serialized = encodeURIComponent(
    JSON.stringify({ value: uiState, version: PERSISTENCE_VERSION }),
  );
  writeToSessionStorage({ key, value: serialized });
};
