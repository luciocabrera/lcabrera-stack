type WithoutNullishValues<T> = {
  readonly [K in keyof T]?: Exclude<T[K], null | undefined>;
};

export const dropNullishValues = <T extends object>(record: T) =>
  Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  ) as WithoutNullishValues<T>;
