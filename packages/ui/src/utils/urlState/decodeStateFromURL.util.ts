import { logger } from '#ui/utils/logger';

type DecodeStateFromURLArgs = {
  readonly convertArraysToSets?: readonly string[];
  readonly encoded: string;
};

/**
 * Decode Base64 URL-safe string to state object
 *
 * @param params - Configuration object
 * @param params.encoded - Base64 URL-safe encoded string
 * @param params.convertArraysToSets - Optional array of keys that should be converted from arrays to Sets
 * @returns Decoded state object or undefined if decoding fails
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
}: DecodeStateFromURLArgs): Record<string, unknown> | undefined => {
  try {
    // Restore Base64 padding and standard characters
    const base64 = encoded
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=');

    const json = atob(base64);
    const parsed = JSON.parse(json) as Record<string, unknown>;

    // Convert specified arrays back to Sets if requested
    if (convertArraysToSets) {
      for (const key of convertArraysToSets) {
        if (Array.isArray(parsed[key])) {
          parsed[key] = new Set(parsed[key] as unknown[]);
        }
      }
    }

    return parsed;
  } catch (error) {
    logger.debug('[urlState] Failed to decode state param:', error);
    return undefined;
  }
};
