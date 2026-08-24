type AreArraysEqualArgs<T> = {
  readonly left?: readonly T[];
  readonly right?: readonly T[];
};

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
