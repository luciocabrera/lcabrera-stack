import { stateCodec } from './stateCodec.util';

type DecodeStateFromURLArgs = {
  readonly convertArraysToSets?: readonly string[];
  readonly encoded: string;
};

type WithArraysAsSetsArgs = {
  readonly keys: readonly string[];
  readonly state: Record<string, unknown>;
};

/** Rehydrates the named array-valued keys into Sets, copying rather than mutating. */
const withArraysAsSets = ({ keys, state }: WithArraysAsSetsArgs) => {
  const wanted = new Set(keys);

  return Object.fromEntries(
    Object.entries(state).map(([key, value]) => [
      key,
      wanted.has(key) && Array.isArray(value)
        ? new Set(value as unknown[])
        : value,
    ]),
  );
};

/**
 * Decode Base64 URL-safe string to state object
 *
 * @param params - Configuration object
 * @param params.encoded - Base64 URL-safe encoded string
 * @param params.convertArraysToSets - Optional array of keys that should be converted from arrays to Sets
 * @returns Decoded state object, or undefined when the param is not decodable Base64, not JSON, or not an object
 *
 * @example
 * ```ts
 * const encoded = "eyJzb3J0aW5nIjpbeyJjb2x1bW5LZXkiOiJuYW1lIiwiZGlyZWN0aW9uIjoiYXNjIn1dfQ";
 * const state = decodeStateFromURL({ encoded });
 * // Returns: { sorting: [{ columnKey: 'name', direction: 'asc' }] }
 * ```
 */
export const decodeStateFromURL = ({
  convertArraysToSets,
  encoded,
}: DecodeStateFromURLArgs) => {
  const state = stateCodec.deserialize(encoded);

  if (state === undefined || convertArraysToSets === undefined) {
    return state;
  }

  return withArraysAsSets({ keys: convertArraysToSets, state });
};
