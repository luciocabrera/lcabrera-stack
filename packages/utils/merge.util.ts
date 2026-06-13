type MergeArraysArgs<T> = {
  readonly baseValue?: readonly T[] | null;
  readonly overrideValue?: readonly T[] | null;
};

type MergeObjectsArgs<T extends object> = {
  readonly baseValue?: T;
  readonly overrideValue?: Partial<T>;
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

/**
 * Shallow merges two optional objects while preserving undefined when both are
 * undefined.
 */
export const mergeObjects = <T extends object>({
  baseValue,
  overrideValue,
}: MergeObjectsArgs<T>): T | undefined => {
  if (baseValue === undefined && overrideValue === undefined) {
    return undefined;
  }

  return {
    ...baseValue,
    ...overrideValue,
  } as T;
};
