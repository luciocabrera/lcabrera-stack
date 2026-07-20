/**
 * Normalise an optional form string for persistence: an empty string becomes
 * `undefined`, which node-postgres serialises to SQL `NULL`; any other string
 * is returned untrimmed. Used when mapping validated form input to
 * insert/update column values so a cleared optional field is stored as NULL
 * (rather than an empty string) on both create and edit.
 */
export const emptyToUndefined = (value: string): string | undefined =>
  value === '' ? undefined : value;
