import { readFromSessionStorage } from '@repo/ui/utils/storage';

import type { PersistedDataState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { parseVersionedPayload } from './parseVersionedPayload.util';
import { DATA_STATE_SESSION_KEY_SUFFIX } from './persistence.constants';

type ReadPersistedDataStateFromSessionStorageArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
};

/**
 * Read persisted table data state from sessionStorage (client-only, tab-scoped).
 * Returns undefined when no data exists or when the payload is invalid.
 */
export const readPersistedDataStateFromSessionStorage = <
  TData = Record<string, unknown>,
>({
  appId,
  persistenceKey,
}: ReadPersistedDataStateFromSessionStorageArgs):
  | PersistedDataState<TData>
  | undefined => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${DATA_STATE_SESSION_KEY_SUFFIX}`;
  const rawValue = readFromSessionStorage({ key });

  if (!rawValue) return undefined;

  return parseVersionedPayload<PersistedDataState<TData>>({ rawValue });
};
