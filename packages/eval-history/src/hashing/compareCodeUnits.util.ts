type StringComparator = (left: string, right: string) => number;

export const compareCodeUnits: StringComparator = (left, right) =>
  Number(left > right) - Number(left < right);
