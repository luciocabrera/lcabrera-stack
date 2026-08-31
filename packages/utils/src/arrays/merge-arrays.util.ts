type MergeArraysArgs<T> = {
  readonly baseValue?: null | readonly T[];
  readonly overrideValue?: null | readonly T[];
};

export const mergeArrays = <T>({
  baseValue,
  overrideValue,
}: MergeArraysArgs<T>): T[] | undefined => {
  if (!baseValue && !overrideValue) {
    return undefined;
  }

  return [...(baseValue ?? []), ...(overrideValue ?? [])];
};
