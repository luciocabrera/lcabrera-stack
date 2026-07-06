type MergeArraysArgs<T> = {
  readonly baseValue?: null | readonly T[];
  readonly overrideValue?: null | readonly T[];
};

/**
 * Concatenates two optional arrays while gracefully handling nullish inputs.
 */
export const mergeArrays = <T>({
  baseValue,
  overrideValue,
}: MergeArraysArgs<T>): T[] | undefined => {
  if (baseValue == undefined && overrideValue == undefined) {
    return undefined;
  }

  return [...(baseValue ?? []), ...(overrideValue ?? [])];
};
