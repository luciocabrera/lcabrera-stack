type AreEqualByJsonArgs<T> = {
  readonly left?: T;
  readonly right?: T;
};

/**
 * Suitable for plain serializable objects where structural equivalence is required (e.g.
 * Caveats: property order matters; non-serializable values (Date, undefined inside arrays,
 * functions) are silently coerced by JSON.stringify.
 */
export const areEqualByJson = <T>({ left, right }: AreEqualByJsonArgs<T>) =>
  JSON.stringify(left) === JSON.stringify(right);
