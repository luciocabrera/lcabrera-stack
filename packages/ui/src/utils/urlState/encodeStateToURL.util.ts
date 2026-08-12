import { stateCodec } from './stateCodec.util';

/**
 * Encode state object to Base64 URL-safe string
 *
 * @param state - State object to encode (Sets will be converted to Arrays)
 * @returns Base64 URL-safe encoded string
 *
 * @example
 * ```ts
 * const state = { sorting: [{ columnKey: 'name', direction: 'asc' }] };
 * const encoded = encodeStateToURL(state);
 * // Returns: "eyJzb3J0aW5nIjpbeyJjb2x1bW5LZXkiOiJuYW1lIiwiZGlyZWN0aW9uIjoiYXNjIn1dfQ"
 * ```
 */
export const encodeStateToURL = (state: Record<string, unknown>) =>
  stateCodec.serialize(state);
