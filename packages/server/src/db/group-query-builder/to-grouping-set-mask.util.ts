type ToGroupingSetMaskArgs = {
  readonly keys: readonly string[];
  readonly set: readonly string[];
};

export const toGroupingSetMask = ({ keys, set }: ToGroupingSetMaskArgs) => {
  const present = new Set(set);

  return keys.reduce(
    (mask, key, index) =>
      present.has(key) ? mask : mask + 2 ** (keys.length - 1 - index),
    0,
  );
};
