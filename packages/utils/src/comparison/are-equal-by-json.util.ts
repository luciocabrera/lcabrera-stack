type AreEqualByJsonArgs<T> = {
  readonly left?: T;
  readonly right?: T;
};

/**
 * Structural equality for plain serializable objects (e.g. persistence hydration guards).
 * Caveats: property order matters; `JSON.stringify` silently coerces Date, undefined
 * inside arrays, and functions.
 */
export const areEqualByJson = <T>({ left, right }: AreEqualByJsonArgs<T>) =>
  JSON.stringify(left) === JSON.stringify(right);
