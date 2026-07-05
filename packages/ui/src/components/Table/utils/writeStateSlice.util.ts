import { writeToCookie, writeToLocalStorage } from '@repo/ui/utils/storage';

import type { StorageType, TablePersistenceConfig } from '../Table.types';

import { serializeStateSlice } from './serializeStateSlice.util';

type WriteStateSliceArgs = {
  readonly appId?: string;
  readonly headers?: Headers;
  readonly persistenceKey: string;
  readonly slice: keyof TablePersistenceConfig;
  readonly storageType: StorageType;
  readonly value: unknown;
};

/**
 * Write state slice to storage (client-side or SSR via headers)
 * Special handling for ColumnVisibilityState (Set → Array for JSON serialization)
 *
 * For server action persistence via useFetcher, use serializeStateSlice + usePersistCookieAction instead.
 */
export const writeStateSlice = ({
  appId,
  headers,
  persistenceKey,
  slice,
  storageType,
  value,
}: WriteStateSliceArgs): void => {
  const { key, value: serialized } = serializeStateSlice({
    appId,
    persistenceKey,
    slice,
    value,
  });

  if (storageType === 'cookie') {
    writeToCookie({ headers, key, value: serialized });
  } else {
    writeToLocalStorage({ key, value: serialized });
  }
};
