type AreArraysEqualArgs<T> = {
  readonly left?: readonly T[];
  readonly right?: readonly T[];
};

export const areArraysEqual = <T>({ left, right }: AreArraysEqualArgs<T>) => {
  if (left === right) {
    return true;
  }

  return !left || !right || left.length !== right.length
    ? false
    : left.every((value, index) => value === right[index]);
};
