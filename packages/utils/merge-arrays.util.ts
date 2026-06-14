type MergeArraysArgs<T> = {
  readonly baseValue?: readonly T[] | null;
  readonly overrideValue?: readonly T[] | null;
};

/**
 * Concatenates two optional arrays while gracefully handling nullish inputs.
 */
export const mergeArrays = <T>({
  baseValue,
  overrideValue,
}: MergeArraysArgs<T>): T[] | undefined => {
  if (baseValue == null && overrideValue == null) {
    return undefined;
  }

  return [...(baseValue ?? []), ...(overrideValue ?? [])];
};
