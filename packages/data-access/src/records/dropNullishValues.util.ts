type WithoutNullishValues<T> = {
  readonly [K in keyof T]?: Exclude<T[K], null | undefined>;
};

/**
 * Drops every entry whose value is null or undefined, so the key is omitted
 * from the result entirely rather than written out as an explicit null.
 *
 * This is the shape a JSON write payload wants: `JSON.stringify` already
 * drops undefined keys, and an omitted key is what lets a column fall back to
 * SQL NULL (or, via jsonb_to_record, stay absent) instead of being set. Use it
 * to build the optional half of a write input in one call, instead of
 * repeating a `...(value !== null && value !== undefined && { key: value })`
 * spread per field — a pattern that costs one conditional per column and adds
 * up fast on wide rows.
 *
 * Shallow by design: nested objects are passed through untouched.
 */
export const dropNullishValues = <T extends object>(record: T) =>
  // Object.fromEntries always widens to Record<string, …>, and TypeScript
  // cannot derive the per-key optionality from a runtime filter, so the
  // mapped type above is the contract and this assertion is what connects
  // them. It is the reason this lives in one tested util rather than being
  // rewritten at each call site.
  Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  ) as WithoutNullishValues<T>;
