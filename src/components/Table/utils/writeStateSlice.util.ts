import { writeToCookie, writeToLocalStorage } from '@/utils/storage';

import type { StorageType, TablePersistenceConfig } from '../Table.types';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type WriteStateSliceArgs = {
  headers?: Headers;
  persistenceKey: string;
  slice: keyof TablePersistenceConfig;
  storageType: StorageType;
  value: unknown;
};

/**
 * Write state slice to storage
 * Special handling for ColumnVisibilityState (Set → Array for JSON serialization)
 */
export const writeStateSlice = ({
  headers,
  persistenceKey,
  slice,
  storageType,
  value,
}: WriteStateSliceArgs): void => {
  const sliceKey = `${getStorageKey({ persistenceKey })}-${slice}`;

  console.log('writeStateSlice', {
    sliceKey,
    storageType,
    value,
  });

  // Convert Set to Array for columnVisibility
  const serializableValue =
    slice === 'columnVisibility' && value instanceof Set ? [...value] : value;

  const serialized = JSON.stringify({
    value: serializableValue,
    version: PERSISTENCE_VERSION,
  });

  if (storageType === 'cookie') {
    writeToCookie({ headers, key: sliceKey, value: serialized });
  } else {
    writeToLocalStorage({ key: sliceKey, value: serialized });
  }
};
