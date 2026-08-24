type WithoutNullishValues<T> = {
  readonly [K in keyof T]?: Exclude<T[K], null | undefined>;
};

/** Shallow by design: nested objects are passed through untouched. */
export const dropNullishValues = <T extends object>(record: T) =>
  // Object.fromEntries always widens to Record<string, …>, and TypeScript
  // cannot derive the per-key optionality from a runtime filter, so the
  // mapped type above is the contract and this assertion is what connects
  // them. It is the reason this lives in one tested util rather than being
  // rewritten at each call site.
  Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  ) as WithoutNullishValues<T>;
