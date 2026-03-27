import type { TablePersistenceConfig } from "../Table.types.ts";

import { getStorageKey } from "./getStorageKey.util.ts";
import { PERSISTENCE_VERSION } from "./persistence.constants.ts";

type SerializedStateSlice = {
  readonly key: string;
  readonly value: string;
};

type SerializeStateSliceArgs = {
  readonly persistenceKey: string;
  readonly slice: keyof TablePersistenceConfig;
  readonly value: unknown;
};

/**
 * Serialize a table state slice for storage.
 * Returns the storage key and JSON-serialized value string.
 *
 * Shared by both writeStateSlice (direct write) and server action persistence.
 */
export const serializeStateSlice = ({
  persistenceKey,
  slice,
  value,
}: SerializeStateSliceArgs): SerializedStateSlice => {
  const key = `${getStorageKey({ persistenceKey })}-${slice}`;

  // Convert Set to Array for columnVisibility
  const serializableValue =
    slice === "columnVisibility" && value instanceof Set ? [...value] : value;

  const serializedValue = JSON.stringify({
    value: serializableValue,
    version: PERSISTENCE_VERSION,
  });

  return { key, value: serializedValue };
};
