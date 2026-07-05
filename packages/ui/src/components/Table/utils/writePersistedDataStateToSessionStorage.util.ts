import { writeToSessionStorage } from '@repo/ui/utils/storage';

import type { PersistedDataState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import {
  DATA_STATE_SESSION_KEY_SUFFIX,
  PERSISTENCE_VERSION,
} from './persistence.constants';

type WritePersistedDataStateToSessionStorageArgs<
  TData = Record<string, unknown>,
> = {
  readonly appId?: string;
  readonly dataState: PersistedDataState<TData>;
  readonly persistenceKey: string;
};

/**
 * Persist table data state to sessionStorage (client-only, tab-scoped).
 * Stored as a single versioned JSON blob under the dataState key.
 */
export const writePersistedDataStateToSessionStorage = <
  TData = Record<string, unknown>,
>({
  appId,
  dataState,
  persistenceKey,
}: WritePersistedDataStateToSessionStorageArgs<TData>): void => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${DATA_STATE_SESSION_KEY_SUFFIX}`;
  const serialized = encodeURIComponent(
    JSON.stringify({ value: dataState, version: PERSISTENCE_VERSION }),
  );
  writeToSessionStorage({ key, value: serialized });
};
