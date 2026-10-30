export const isNonEmptyArray = <T>(
  values: readonly T[],
): values is readonly [T, ...T[]] => values.length > 0;
