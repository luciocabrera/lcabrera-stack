/**
 * Safely converts a primitive leaf-field value to display text. Guards against
 * `String()`'s `[object Object]` output on non-primitives (returns `''` for
 * those) — leaf-field values are always primitives in practice, so this only
 * narrows the `unknown` the store hands back.
 */
export const stringifyLeafValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};
