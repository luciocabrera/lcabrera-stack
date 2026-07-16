type AreArraysEqualArgs<T> = {
  readonly left?: readonly T[];
  readonly right?: readonly T[];
};

/**
 * Ordered strict equality check for arrays.
 *
 * Returns true only when both arrays have the same length and all values at
 * matching indices are strictly equal (`===`).
 */
export const areArraysEqual = <T>({ left, right }: AreArraysEqualArgs<T>) => {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};
