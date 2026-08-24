type MergeArraysArgs<T> = {
  readonly baseValue?: null | readonly T[];
  readonly overrideValue?: null | readonly T[];
};

export const mergeArrays = <T>({
  baseValue,
  overrideValue,
}: MergeArraysArgs<T>): T[] | undefined => {
  // Nullish check without a loose `==` (Biome's noDoubleEquals) and without
  // naming `null` (eslint's unicorn/no-null): arrays are always truthy, even
  // when empty, so falsy here means exactly `null` or `undefined`.
  if (!baseValue && !overrideValue) {
    return undefined;
  }

  return [...(baseValue ?? []), ...(overrideValue ?? [])];
};
