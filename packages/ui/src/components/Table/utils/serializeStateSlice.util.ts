import type { TablePersistenceConfig } from '../Table.types';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type SerializeStateSliceArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
  readonly slice: keyof TablePersistenceConfig;
  readonly value: unknown;
};

/**
 * Serialize a table state slice for storage.
 * Returns the storage key and JSON-serialized value string.
 *
 * Shared by the column-sizing and table-state cookie writes, all of which
 * persist through the `/_action/persist-cookie` server action.
 */
export const serializeStateSlice = ({
  appId,
  persistenceKey,
  slice,
  value,
}: SerializeStateSliceArgs) => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${slice}`;

  // Convert Set to Array for columnVisibility
  const serializableValue =
    slice === 'columnVisibility' && value instanceof Set ? [...value] : value;

  const serializedValue = JSON.stringify({
    value: serializableValue,
    version: PERSISTENCE_VERSION,
  });

  return { key, value: serializedValue };
};
