import { readFromSessionStorage } from '@repo/ui/utils/storage';

import type { PersistedState } from './persistence.types';

import { collectPersistedStateSlices } from './collectPersistedStateSlices.util';

type ReadPersistedStateFromSessionStorageArgs = {
  readonly persistenceKey: string;
};

/**
 * Read persisted column state slices from sessionStorage (client-only, tab-scoped).
 * Uses the same key format and version check as the cookie reader.
 * Returns an empty object on SSR or if no session data exists.
 */
export const readPersistedStateFromSessionStorage = <
  TData = Record<string, unknown>,
>({
  persistenceKey,
}: ReadPersistedStateFromSessionStorageArgs): Partial<PersistedState<TData>> =>
  collectPersistedStateSlices<TData>({
    persistenceKey,
    readRawSlice: (sliceKey) => readFromSessionStorage({ key: sliceKey }),
  });
