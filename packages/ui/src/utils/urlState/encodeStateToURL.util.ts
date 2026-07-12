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
export const encodeStateToURL = (state: Record<string, unknown>) => {
  // Convert Sets to Arrays for JSON serialization
  const serializable = Object.fromEntries(
    Object.entries(state).map(([key, value]) => [
      key,
      value instanceof Set ? [...value] : value,
    ]),
  );

  const json = JSON.stringify(serializable);
  // Use btoa for Base64 encoding (browser native)
  // Make URL-safe by replacing special characters
  return btoa(json)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
};
