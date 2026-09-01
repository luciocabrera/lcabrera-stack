type MergeObjectsArgs<T extends object> = {
  readonly baseValue?: T;
  readonly overrideValue?: Partial<T>;
};

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
