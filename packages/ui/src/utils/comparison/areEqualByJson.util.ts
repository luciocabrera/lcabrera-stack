type AreEqualByJsonArgs<T> = {
  readonly left?: T;
  readonly right?: T;
};

/**
 * Deep equality check via JSON serialization.
 *
 * Suitable for plain serializable objects where structural equivalence is
 * required (e.g. persistence hydration guards).
 *
 * Caveats: property order matters; non-serializable values (Date, undefined
 * inside arrays, functions) are silently coerced by JSON.stringify.
 *
 * @example
 * ```ts
 * areEqualByJson({ left: { a: 1 }, right: { a: 1 } }); // true
 * areEqualByJson({ left: { a: 1 }, right: { a: 2 } }); // false
 * ```
 */
export const areEqualByJson = <T>({ left, right }: AreEqualByJsonArgs<T>) =>
  JSON.stringify(left) === JSON.stringify(right);
