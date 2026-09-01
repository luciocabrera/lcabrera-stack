type AreEqualByJsonArgs<T> = {
  readonly left?: T;
  readonly right?: T;
};

export const areEqualByJson = <T>({ left, right }: AreEqualByJsonArgs<T>) =>
  JSON.stringify(left) === JSON.stringify(right);
