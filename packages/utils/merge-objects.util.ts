type MergeObjectsArgs<T extends object> = {
  readonly baseValue?: T;
  readonly overrideValue?: Partial<T>;
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
