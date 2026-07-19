/**
 * Parse a JSON search-param value, returning `undefined` for a missing param
 * or malformed JSON instead of throwing. The caller narrows the `unknown`
 * result to the shape it expects.
 */
export const safeJsonParse = (raw: null | string): unknown => {
  if (raw === null || raw === '') {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};
