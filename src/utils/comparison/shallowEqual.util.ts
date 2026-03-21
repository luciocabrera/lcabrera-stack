type ShallowEqualArgs<T extends Record<string, unknown>> = {
  readonly objA: T | undefined;
  readonly objB: T | undefined;
};

/**
 * Shallow equality check for objects
 *
 * Compares two objects by checking if they have the same keys
 * and if all values are strictly equal (===).
 *
 * @example
 * ```ts
 * shallowEqual({ objA: { a: 1 }, objB: { a: 1 } }); // true
 * shallowEqual({ objA: { a: 1 }, objB: { a: 2 } }); // false
 * shallowEqual({ objA: { a: 1, b: 2 }, objB: { a: 1 } }); // false
 * ```
 */
export const shallowEqual = <T extends Record<string, unknown>>({
  objA,
  objB,
}: ShallowEqualArgs<T>): boolean => {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.hasOwn(objB, key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
};
