import { writeToSessionStorage } from '@repo/ui/utils/storage';

import type { PersistedUiState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import {
  PERSISTENCE_VERSION,
  UI_STATE_SESSION_KEY_SUFFIX,
} from './persistence.constants';

type WritePersistedUiStateToSessionStorageArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
  readonly uiState: PersistedUiState;
};

/**
 * Persist meta UI state to sessionStorage (client-only, tab-scoped).
 * Stored as a single versioned JSON blob under the uiState key.
 */
export const writePersistedUiStateToSessionStorage = ({
  appId,
  persistenceKey,
  uiState,
}: WritePersistedUiStateToSessionStorageArgs): void => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${UI_STATE_SESSION_KEY_SUFFIX}`;
  const serialized = encodeURIComponent(
    JSON.stringify({ value: uiState, version: PERSISTENCE_VERSION }),
  );
  writeToSessionStorage({ key, value: serialized });
};
