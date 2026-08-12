type ToGroupingSetMaskArgs = {
  readonly keys: readonly string[];
  readonly set: readonly string[];
};

/**
 * The value `GROUPING(k₁, …, kₙ)` returns for one grouping set: bit `n-1-i` is
 * 1 when `keys[i]` is **absent** from the set, so the first key owns the most
 * significant bit.
 *
 * Computed at build time and shipped on the result, because the mask is the
 * only thing that separates a structural NULL ("all countries") from a real
 * one — the two are textually identical in the row.
 *
 * Each key contributes a distinct power of two, so summing is exact; it is
 * written as addition rather than `|` because the bits never overlap.
 */
export const toGroupingSetMask = ({ keys, set }: ToGroupingSetMaskArgs) => {
  const present = new Set(set);

  return keys.reduce(
    (mask, key, index) =>
      present.has(key) ? mask : mask + 2 ** (keys.length - 1 - index),
    0,
  );
};
