type ExpandCubeSetsArgs = {
  readonly keys: readonly string[];
};

/**
 * The order is not a convention chosen here — it is **ascending `GROUPING()` mask**.
 * Bit `n-1-i` of the mask is 1 when `keys[i]` is absent (`to-grouping-set-mask.util.ts`),
 * so counting 0 → 2ⁿ-1 walks from the full key list down to the grand total, dropping the
 * *last* key fastest.
 */
export const expandCubeSets = ({
  keys,
}: ExpandCubeSetsArgs): readonly (readonly string[])[] =>
  Array.from({ length: 2 ** keys.length }, (_, mask) =>
    keys.filter(
      (_key, index) => (mask & (2 ** (keys.length - 1 - index))) === 0,
    ),
  );
