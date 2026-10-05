type AreArraysEqualArgs<T> = {
  readonly left?: readonly T[];
  readonly right?: readonly T[];
};

export const areArraysEqual = <T>({ left, right }: AreArraysEqualArgs<T>) => {
  if (left === right) {
    return true;
  }

  return (
    left !== undefined &&
    right !== undefined &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
};
