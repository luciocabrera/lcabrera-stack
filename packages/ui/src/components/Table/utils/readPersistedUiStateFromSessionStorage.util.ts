import { readFromSessionStorage } from '@repo/ui/utils/storage';

import type { PersistedUiState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { parseVersionedPayload } from './parseVersionedPayload.util';
import { UI_STATE_SESSION_KEY_SUFFIX } from './persistence.constants';

type ReadPersistedUiStateFromSessionStorageArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
};

/**
 * Read persisted meta UI state from sessionStorage (client-only, tab-scoped).
 * Returns an empty object on SSR or if no session data exists.
 */
export const readPersistedUiStateFromSessionStorage = ({
  appId,
  persistenceKey,
}: ReadPersistedUiStateFromSessionStorageArgs): PersistedUiState => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${UI_STATE_SESSION_KEY_SUFFIX}`;
  const rawValue = readFromSessionStorage({ key });

  if (!rawValue) return {};

  return parseVersionedPayload<PersistedUiState>({ rawValue }) ?? {};
};
